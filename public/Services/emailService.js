import emailjs from "@emailjs/browser";

export const sendIntruderAlert = async ({ imageUrl, timestamp }) => {
    return emailjs.send(
        "service_xnnaxlq",
        "template_dwu7smp",
        {
            alert_time: timestamp,
            alert_message: "Security Alert: An unidentified individual has been detected in a restricted area. Access has been denied by the administrator.",
            intruder_image_url: imageUrl,
        },
        "n75VxnvpgKa2ZLXcv"
    );
};
