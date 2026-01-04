

import * as faceapi from "face-api.js";
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db } from "../Firebase/Firebase";
import { getStorage, ref, uploadString } from "firebase/storage";


let labeledFaceDescriptors = null;
let faceMatcher = null;
let isModelsLoaded = false;
let lastUnknownDetection = null;
let isUnknownLocked = false;

let currentVideoEl = null;

let unknownTimer = null;
let unknownStartTime = null;
const UNKNOWN_THRESHOLD = 1000;

const storage = getStorage();


let unsubscribeBorderDB = null;

async function listenToFaceDatabase() {
  if (unsubscribeBorderDB) unsubscribeBorderDB();

  unsubscribeBorderDB = onSnapshot(
    collection(db, "Border-DB"),
    async (snapshot) => {
      console.log("🔄 Face DB updated. Rebuilding matcher...");

      const data = snapshot.docs.map(doc => doc.data());

      const descriptors = await Promise.all(
        data.map(async (entry) => {
          const label =
            typeof entry.title === "string"
              ? entry.title.trim()
              : null;

          const imageUrls = Array.isArray(entry.images)
            ? entry.images
            : [];

          if (!label || imageUrls.length === 0) return null;

          const descs = [];

          for (const url of imageUrls) {
            try {
              const img = await faceapi.fetchImage(url);
              const det = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (det) descs.push(det.descriptor);
            } catch (e) {
              console.error("Image error:", url);
            }
          }

          return descs.length
            ? new faceapi.LabeledFaceDescriptors(label, descs)
            : null;
        })
      );

      labeledFaceDescriptors = descriptors.filter(Boolean);

      if (labeledFaceDescriptors.length) {
        faceMatcher = new faceapi.FaceMatcher(
          labeledFaceDescriptors,
          0.5
        );

        console.log("✅ FaceMatcher updated in real-time");
      }
    }
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

  await listenToFaceDatabase();
  isModelsLoaded = true;
}


function captureFaceImage(videoEl) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;

  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", 0.9);
}


function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FaceSurveillanceDB", 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("unknown_faces")) {
        db.createObjectStore("unknown_faces", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeUnknownFace(imageBase64) {
  const db = await openDB();

  const tx = db.transaction("unknown_faces", "readwrite");
  const store = tx.objectStore("unknown_faces");

  const record = {
    id: `unknown_${Date.now()}`,
    image: imageBase64,
    detectedAt: new Date().toISOString(),
    status: "unverified",
  };

  store.add(record);
}




export async function detectFaces(videoEl) {
  if (!isModelsLoaded || !faceMatcher) {
    console.warn("Models not ready yet...");
    return [];
  }

  // Keep reference for image capture
  currentVideoEl = videoEl;

  // 1️⃣ Detect faces
  const detections = await faceapi
    .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();

  // 2️⃣ Match faces
  const results = detections.map((d) => {
    const bestMatch = faceMatcher.findBestMatch(d.descriptor);
    return {
      detection: d.detection,
      label: bestMatch.label,
      accuracy: bestMatch.distance,
    };
  });

  // 3️⃣ Track unknown face
  const unknownFace = results.find(r => r.label === "unknown");

  if (unknownFace) {
    lastUnknownDetection = unknownFace.detection;
    triggerUnknownAlert();
  } else {
    resetUnknownTimer();
  }

  return results;
}

export function resetUnknownLock() {
  isUnknownLocked = false;
  unknownStartTime = null;
  unknownTimer = null;
}



function triggerUnknownAlert() {
  if (isUnknownLocked) return;

  const now = Date.now();

  if (!unknownStartTime) unknownStartTime = now;

  const elapsed = now - unknownStartTime;

  if (elapsed >= UNKNOWN_THRESHOLD && !unknownTimer) {
    unknownTimer = true;
    isUnknownLocked = true;

    let frameImage = null;

    if (currentVideoEl) {
      frameImage = captureFaceImage(currentVideoEl);
      storeUnknownFace(frameImage);
    }

    window.dispatchEvent(
      new CustomEvent("unknown-face-detected", {
        detail: { image: frameImage },
      })
    );

    const unknownSound = new Audio("/sounds/unknown-alert.mp3");
    unknownSound.play().catch(() =>
      console.warn("Unknown alert blocked until interaction")
    );
  }
}





function resetUnknownTimer() {
  if (unknownStartTime || unknownTimer) {
    unknownStartTime = null;
    unknownTimer = null;
  }
}