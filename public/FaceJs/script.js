// import * as faceapi from "face-api.js";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "../Firebase/Firebase";

// let labeledFaceDescriptors = null;
// let faceMatcher = null;
// let isModelsLoaded = false;

// let unknownTimer = null;
// let unknownStartTime = null;
// const UNKNOWN_THRESHOLD = 3000;



// function waitForImageLoad(img) {
//   return new Promise((resolve) => {
//     if (img.complete) resolve();
//     else img.onload = resolve;
//   });
// }


// async function getLabeledFaceDescriptions() {
//   const snapshot = await getDocs(collection(db, "Border-DB"));
//   const data = snapshot.docs.map((doc) => doc.data());

//   return Promise.all(
//     data.map(async (entry) => {
//       const label = entry.title.trim();
//       const imageUrl = entry.image;

//       const descriptions = [];
//       const augmentedImgs = await generateAugmentedImages(imageUrl, 8);

//       for (const img of augmentedImgs) {
//         await waitForImageLoad(img);
//         const detection = await faceapi
//           .detectSingleFace(img)
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) descriptions.push(detection.descriptor);
//       }


//       return new faceapi.LabeledFaceDescriptors(label, descriptions);
//     })
//   );
// }

// export async function loadModels() {
//   if (isModelsLoaded) return;

//   await Promise.all([
//     faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
//     faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//     faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//     faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//     faceapi.nets.faceExpressionNet.loadFromUri("/models"),
//   ]);

//   labeledFaceDescriptors = await getLabeledFaceDescriptions();
//   faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
//   isModelsLoaded = true;
// }


// export async function detectFaces(videoEl) {
//   if (!isModelsLoaded || !faceMatcher) {
//     console.warn("⚠️ Models not ready yet...");
//     return [];
//   }

//   const detections = await faceapi
//     .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
//     .withFaceLandmarks()
//     .withFaceDescriptors();

//   const results = detections.map((d) => {
//     const bestMatch = faceMatcher.findBestMatch(d.descriptor);
//     return {
//       detection: d.detection,
//       label: bestMatch.label,
//       accuracy: bestMatch.distance,
//     };
//   });

//   const unknownDetected = results.some((r) => r.label === "unknown");

//   if (unknownDetected) {
//     triggerUnknownAlert();
//   } else {
//     resetUnknownTimer();
//   }



//   return results;
// }


// async function generateAugmentedImages(imgUrl, count = 10) {
//   const baseImg = await faceapi.fetchImage(imgUrl);
//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d");
//   canvas.width = baseImg.width;
//   canvas.height = baseImg.height;

//   const augmentedImages = [];

//   for (let i = 0; i < count; i++) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.save();


//     const angle = ((Math.random() - 0.5) * 15 * Math.PI) / 180;
//     const scale = 1 + (Math.random() - 0.5) * 0.15;
//     const tx = (Math.random() - 0.5) * 0.1 * canvas.width;
//     const ty = (Math.random() - 0.5) * 0.1 * canvas.height;

//     ctx.translate(canvas.width / 2 + tx, canvas.height / 2 + ty);
//     ctx.rotate(angle);
//     ctx.scale(scale, scale);


//     const brightness = 1 + (Math.random() - 0.5) * 0.4;
//     const blur = Math.random() * 0.8;
//     ctx.filter = `brightness(${brightness}) blur(${blur}px) contrast(${1 + (Math.random() - 0.5) * 0.3})`;

//     ctx.drawImage(baseImg, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
//     ctx.restore();

//     const img = new Image();
//     img.src = canvas.toDataURL("image/jpeg");
//     augmentedImages.push(img);
//   }

//   return augmentedImages;
// }



// function triggerUnknownAlert() {
//   const now = Date.now();

//   if (!unknownStartTime) {
//     unknownStartTime = now;
//   }

//   if (unknownTimer) clearTimeout(unknownTimer);

//   unknownTimer = setTimeout(() => {
//     const duration = Date.now() - unknownStartTime;
//     if (duration >= UNKNOWN_THRESHOLD) {
//       showRedBox = true;
//       const event = new CustomEvent("unknown-face-detected");
//       window.dispatchEvent(event);

//       const audio = new Audio("/alert-sound.mp3");
//       audio.play().catch(() => console.warn("Sound blocked until user interacts"));
//     }

//     unknownStartTime = null;
//     unknownTimer = null;
//   }, UNKNOWN_THRESHOLD);
// }

// function resetUnknownTimer() {
//   if (unknownTimer) {
//     clearTimeout(unknownTimer);
//     unknownTimer = null;
//   }
//   unknownStartTime = null;
// }

import * as faceapi from "face-api.js";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

let labeledFaceDescriptors = null;
let faceMatcher = null;
let isModelsLoaded = false;

let unknownTimer = null;
let unknownStartTime = null;
const UNKNOWN_THRESHOLD = 2000;

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

  if (!unknownStartTime) {
    unknownStartTime = now;
  }

  if (unknownTimer) clearTimeout(unknownTimer);

  unknownTimer = setTimeout(() => {
    const duration = Date.now() - unknownStartTime;
    if (duration >= UNKNOWN_THRESHOLD) {
      // showRedBox = true; // This variable wasn't defined, be careful
      const event = new CustomEvent("unknown-face-detected");
      window.dispatchEvent(event);

      const audio = new Audio("/alert-sound.mp3");
      audio.play().catch(() => console.warn("Sound blocked until user interacts"));
    }

    unknownStartTime = null;
    unknownTimer = null;
  }, UNKNOWN_THRESHOLD);
}

function resetUnknownTimer() {
  if (unknownTimer) {
    clearTimeout(unknownTimer);
    unknownTimer = null;
  }
  unknownStartTime = null;
}