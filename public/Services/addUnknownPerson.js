import { uploadToCloudinary } from "./uploadToCloudinary";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

export async function addUnknownPerson({ title, description, images, timestamp }) {
    if (!images || images.length === 0) {
        throw new Error("Image file missing");
    }

    const uploadedUrls = [];

    for (const file of images) {
        const url = await uploadToCloudinary(file);
        uploadedUrls.push(url);
    }

    await addDoc(collection(db, "Border-DB"), {
        title,
        description,
        images: uploadedUrls,
        timestamp,
    });
}
