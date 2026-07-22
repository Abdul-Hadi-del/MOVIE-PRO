import emailjs from "@emailjs/browser";

const SERVICE_ID = "service_z2mh0c5";
const TEMPLATE_ID = "template_zuvo1sn";
const PUBLIC_KEY = "JIAd2JDLMGb5L4DV4";

emailjs.init(PUBLIC_KEY);

export async function sendWatchPartyEmail({ toEmail, toName, movieTitle, watchDate, watchTime, note }) {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      email: toEmail,
      to_name: toName,
      movie_title: movieTitle,
      watch_date: watchDate,
      watch_time: watchTime,
      note: note || "Don't forget to grab your snacks!",
      app_url: window.location.origin,
    });
    return true;
  } catch (err) {
    console.error("EmailJS error:", err);
    return false;
  }
}