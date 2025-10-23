// src/lib/uploadCloudinary.js
export async function uploadToCloudinary(file) {
    const cloud = process.env.REACT_APP_CLOUDINARY_CLOUD;
    const preset = process.env.REACT_APP_CLOUDINARY_PRESET;
    if (!cloud || !preset) throw new Error("Missing Cloudinary env vars");
  
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", preset);
    // optional: you can also add tags etc: form.append("tags", "avatar");
  
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // => { secure_url, public_id, width, height, ... }
  }
  