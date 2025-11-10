import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDueoajLV-hV2ke_F1O7U9GEW2AbOn_Cd8",
    authDomain: "blog-2354a.firebaseapp.com",
    projectId: "blog-2354a",
    storageBucket: "blog-2354a.firebasestorage.app",
    messagingSenderId: "668382468294",
    appId: "1:668382468294:web:19557c28f8db9357581fc7",
    measurementId: "G-GPSREJDC00"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);