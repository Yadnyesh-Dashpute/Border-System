import axios from "axios";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../Firebase/Firebase";

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/dttxony05/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "blog_website";

export async function addUnknownPerson({ title, description, images, timestamp }) {
    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new Error("Image file missing");
    }

    const uploadedUrls = [];

    for (const file of images) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await axios.post(CLOUDINARY_URL, formData);
        uploadedUrls.push(res.data.secure_url);
    }

    await addDoc(collection(db, "Border-DB"), {
        title,
        description,
        images: uploadedUrls,
        timestamp,
    });
}
