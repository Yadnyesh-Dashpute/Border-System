

import * as faceapi from "face-api.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

let labeledFaceDescriptors = null;
let faceMatcher = null;
let isModelsLoaded = false;

let unknownTimer = null;
let unknownStartTime = null;
const UNKNOWN_THRESHOLD = 1000;

// This function loops through the REAL image array from Firestore
async function getLabeledFaceDescriptions() {
  const snapshot = await getDocs(collection(db, "Border-DB"));
  const data = snapshot.docs.map((doc) => doc.data());

  return Promise.all(
    data.map(async (entry) => {
      const label = entry.title.trim();
      const imageUrls = entry.images; // Get the array of images
      const descriptions = [];

      // Loop through each real image URL
      for (const imageUrl of imageUrls) {
        try {
          // Fetch the image
          const img = await faceapi.fetchImage(imageUrl);

          // Get the descriptor
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

      // Only return a label if we have valid descriptors
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

  // Filter out any null entries (users with no valid pics)
  labeledFaceDescriptors = descriptors.filter(d => d !== null);

  if (labeledFaceDescriptors.length === 0) {
    console.error("No labeled face descriptors were loaded. Face recognition will not work.");
    isModelsLoaded = true;
    return;
  }

  // Create the FaceMatcher with the good descriptors
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
  isModelsLoaded = true;
  console.log("✅ Face models and descriptors loaded successfully.");
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

// All other functions (triggerUnknownAlert, resetUnknownTimer) remain the same

function triggerUnknownAlert() {
  const now = Date.now();

  // If this is the first unknown frame, start timing
  if (!unknownStartTime) {
    unknownStartTime = now;
  }

  // Calculate how long it's been continuously unknown
  const elapsed = now - unknownStartTime;

  // If unknown for >= 2000ms (2 seconds), trigger the alert once
  if (elapsed >= UNKNOWN_THRESHOLD && !unknownTimer) {
    unknownTimer = true; // flag so it doesn’t keep triggering repeatedly

    console.log("🚨 Unknown person detected for 2+ seconds");

    // Dispatch a custom event (optional)
    const event = new CustomEvent("unknown-face-detected");
    window.dispatchEvent(event);

    // Play alert sound
    const audio = new Audio("/alert-sound.mp3");
    audio.play().catch(() => console.warn("Sound blocked until user interacts"));
  }
}

function resetUnknownTimer() {
  // Reset everything when a known face is detected
  if (unknownStartTime || unknownTimer) {
    unknownStartTime = null;
    unknownTimer = null;
  }
}