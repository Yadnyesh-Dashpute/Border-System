import * as faceapi from "face-api.js";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase"

let labeledFaceDescriptors = null;
let faceMatcher = null;
let isModelsLoaded = false;


export async function loadModels() {
  if (isModelsLoaded) return;

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  ]);

  labeledFaceDescriptors = await getLabeledFaceDescriptions();
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45);
  isModelsLoaded = true;
}


export async function detectFaces(videoEl) {
  if (!isModelsLoaded || !faceMatcher) {
    console.warn("⚠️ Models not ready yet...");
    return [];
  }

  const detections = await faceapi
    .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) return [];

  const results = detections.map((d) => {
    const bestMatch = faceMatcher.findBestMatch(d.descriptor);
    return {
      detection: d.detection,
      label: bestMatch.label,
      accuracy: bestMatch.distance,
    };
  });

  const unknownDetected = results.some((r) => r.label === "unknown");
  if (unknownDetected) triggerUnknownAlert();

  return results;
}

async function getLabeledFaceDescriptions() {
  const snapshot = await getDocs(collection(db, "Border-DB"));
  const data = snapshot.docs.map((doc) => doc.data());

  return Promise.all(
    data.map(async (entry) => {
      const label = entry.title.trim();
      const imageUrl = entry.image;

      const descriptions = [];
      const augmentedImgs = await generateAugmentedImages(imageUrl, 8);

      for (const img of augmentedImgs) {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) descriptions.push(detection.descriptor);
      }


      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

async function generateAugmentedImages(imgUrl, count = 8) {
  const baseImg = await faceapi.fetchImage(imgUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;

  const augmentedImages = [];

  for (let i = 0; i < count; i++) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(((Math.random() - 0.5) * 10 * Math.PI) / 180);
    ctx.scale(1 + (Math.random() - 0.5) * 0.1, 1 + (Math.random() - 0.5) * 0.1);
    ctx.filter = `brightness(${1 + (Math.random() - 0.5) * 0.3}) blur(${Math.random() * 0.6}px)`;
    ctx.drawImage(baseImg, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();

    const img = new Image();
    img.src = canvas.toDataURL("image/jpeg");
    augmentedImages.push(img);
  }

  return augmentedImages;
}

function triggerUnknownAlert() {
  if (window.lastUnknownAlert && Date.now() - window.lastUnknownAlert < 4000) return;
  window.lastUnknownAlert = Date.now();


  const event = new CustomEvent("unknown-face-detected");
  window.dispatchEvent(event);


  const audio = new Audio("/alert-sound.mp3");
  audio.play().catch(() => console.warn("🔇 Sound blocked until user interacts"));
}

