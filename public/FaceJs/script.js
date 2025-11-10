import * as faceapi from "face-api.js";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase"



let labeledFaceDescriptors = null;
let faceMatcher = null;

export async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  await faceapi.nets.faceExpressionNet.loadFromUri("/models");

  if (!labeledFaceDescriptors) {
    labeledFaceDescriptors = await getLabeledFaceDescriptions();
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.45);
  }
}

// 🧠 Augmentation function (same as before)
async function generateAugmentedImages(imgUrl, count = 12) {
  const baseImg = await faceapi.fetchImage(imgUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = baseImg.width;
  canvas.height = baseImg.height;

  const augmentedImages = [];

  const drawAugmented = (options = {}) => {
    const {
      rotate = 0,
      scale = 1,
      brightness = 1,
      blur = 0,
      flip = false,
      offsetX = 0,
      offsetY = 0,
    } = options;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale * (flip ? -1 : 1), scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.filter = `brightness(${brightness}) blur(${blur}px)`;
    ctx.drawImage(baseImg, offsetX, offsetY);
    ctx.restore();

    const newImg = new Image();
    newImg.src = canvas.toDataURL("image/jpeg");
    augmentedImages.push(newImg);
  };

  for (let i = 0; i < count; i++) {
    drawAugmented({
      rotate: (Math.random() - 0.5) * 10,
      scale: 1 + (Math.random() - 0.5) * 0.1,
      brightness: 1 + (Math.random() - 0.5) * 0.3,
      blur: Math.random() * 0.5,
      flip: Math.random() > 0.8,
      offsetX: (Math.random() - 0.5) * 10,
      offsetY: (Math.random() - 0.5) * 10,
    });
  }

  return augmentedImages;
}

// 🏷️ Fetch labels + images from Firebase
async function getLabeledFaceDescriptions() {
  const snapshot = await getDocs(collection(db, "Border-DB"));

  const data = snapshot.docs.map((doc) => doc.data());
  // data = [{ title: "Ganesh", image: "https://..." }, {...}]

  return Promise.all(
    data.map(async (entry) => {
      const label = entry.title.trim();
      const imageUrl = entry.image;

      const descriptions = [];
      const augmentedImgs = await generateAugmentedImages(imageUrl, 12);

      for (const img of augmentedImgs) {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) descriptions.push(detection.descriptor);
      }

      console.log(`✅ Processed ${descriptions.length} images for ${label}`);
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

// 🧩 Face detection with unknown alert
export async function detectFaces(videoEl) {
  const detections = await faceapi
    .detectAllFaces(videoEl)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (!detections.length) return [];

  const results = detections.map((d) => {
    const bestMatch = faceMatcher.findBestMatch(d.descriptor);
    return {
      box: d.detection.box,
      label: bestMatch.label,
      accuracy: bestMatch.distance,
    };
  });

  const unknownDetected = results.some((r) => r.label === "unknown");
  if (unknownDetected) triggerUnknownAlert();

  return results;
}

// ⚠️ Alert for unknown faces
function triggerUnknownAlert() {
  if (window.lastUnknownAlert && Date.now() - window.lastUnknownAlert < 5000)
    return;
  window.lastUnknownAlert = Date.now();

  alert("⚠️ Unknown person detected!");
  const audio = new Audio("/alert-sound.mp3");
  audio.play().catch(() => console.log("Sound blocked until user interacts"));

  const overlay = document.createElement("div");
  overlay.textContent = "⚠️ Unknown person detected!";
  overlay.style.position = "fixed";
  overlay.style.top = "10px";
  overlay.style.right = "10px";
  overlay.style.background = "red";
  overlay.style.color = "white";
  overlay.style.padding = "10px 15px";
  overlay.style.borderRadius = "8px";
  overlay.style.zIndex = "9999";
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 4000);
}
