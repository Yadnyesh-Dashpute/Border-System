

import * as faceapi from "face-api.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

let labeledFaceDescriptors = null;
let faceMatcher = null;
let isModelsLoaded = false;

let unknownTimer = null;
let unknownStartTime = null;
const UNKNOWN_THRESHOLD = 1000;

async function getLabeledFaceDescriptions() {
  const snapshot = await getDocs(collection(db, "Border-DB"));
  const data = snapshot.docs.map((doc) => doc.data());

  return Promise.all(
    data.map(async (entry) => {
      const label = entry.title.trim();
      const imageUrls = entry.images;
      const descriptions = [];

      for (const imageUrl of imageUrls) {
        try {
          const img = await faceapi.fetchImage(imageUrl);

          const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            descriptions.push(detection.descriptor);
          } else {
            console.warn(`No face detected in one of the images for ${label}: ${imageUrl}`);
          }
        } catch (err) {
          console.error(`Failed to process image ${imageUrl} for ${label}`, err);
        }
      }

      if (descriptions.length > 0) {
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      } else {
        console.warn(`No descriptors were created for ${label}. They will not be recognized.`);
        return null; // We will filter this out
      }
    })
  );
}

export async function loadModels() {
  if (isModelsLoaded) return;

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  ]);

  const descriptors = await getLabeledFaceDescriptions();

  labeledFaceDescriptors = descriptors.filter(d => d !== null);

  if (labeledFaceDescriptors.length === 0) {
    console.error("No labeled face descriptors were loaded. Face recognition will not work.");
    isModelsLoaded = true;
    return;
  }

  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
  isModelsLoaded = true;
}


export async function detectFaces(videoEl) {
  if (!isModelsLoaded || !faceMatcher) {
    console.warn("Models not ready yet...");
    return [];
  }

  const detections = await faceapi
    .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  const results = detections.map((d) => {
    const bestMatch = faceMatcher.findBestMatch(d.descriptor);
    return {
      detection: d.detection,
      label: bestMatch.label,
      accuracy: bestMatch.distance,
    };
  });

  const unknownDetected = results.some((r) => r.label === "unknown");

  if (unknownDetected) {
    triggerUnknownAlert();
  } else {
    resetUnknownTimer();
  }

  return results;
}


function triggerUnknownAlert() {
  const now = Date.now();

  if (!unknownStartTime) {
    unknownStartTime = now;
  }

  const elapsed = now - unknownStartTime;

  if (elapsed >= UNKNOWN_THRESHOLD && !unknownTimer) {
    unknownTimer = true;


    const event = new CustomEvent("unknown-face-detected");
    window.dispatchEvent(event);

    const audio = new Audio("/alert-sound.mp3");
    audio.play().catch(() => console.warn("Sound blocked until user interacts"));
  }
}

function resetUnknownTimer() {
  if (unknownStartTime || unknownTimer) {
    unknownStartTime = null;
    unknownTimer = null;
  }
}