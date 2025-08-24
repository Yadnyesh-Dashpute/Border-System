import * as faceapi from "face-api.js";

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
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  }
}

async function getLabeledFaceDescriptions() {
  const labels = ["Yadnyesh", "Ganesh"];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`/labels/${label}/${i}.jpg`);
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

  return results;
}
