import axios from "axios";

const CLOUDINARY_URL =
    "https://api.cloudinary.com/v1_1/dttxony05/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "blog_website";

export const uploadToCloudinary = async (file) => {
    if (!file) throw new Error("No file provided");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await axios.post(CLOUDINARY_URL, formData);
    return res.data.secure_url;
};
