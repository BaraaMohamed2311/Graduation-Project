import userNotification from "./userNotification";

export default function uploadPatientFileXHR(url, files, modifier_data, token, setProgress) {
  const mimetypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/dicom",
    "text/plain",
  ]);
  console.log("files here",files)
  const maxSizeInBytes = 20 * 1024 * 1024; // 20MB
  const fileArray = Array.isArray(files) ? files : Array.from(files);

  // Validate files
  for (const file of fileArray) {
    if (!mimetypes.has(file.type)) {
      return userNotification("error", `${file.name} has an invalid file type.`);
    }
    if (file.size > maxSizeInBytes) {
      return userNotification("error", `${file.name} exceeds 20MB size limit.`);
    }
  }

  const perms_requested = "Modify Patient Files";
  const formData = new FormData();

  fileArray.forEach((file) => formData.append("patient_file", file));
  for (const key in modifier_data) {
    if (modifier_data[key] !== undefined && modifier_data[key] !== null) {
      formData.append(key, modifier_data[key]);
    }
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${process.env.APIKEY}/${url}?perms_requested=${perms_requested}`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";

    // Track upload progress
    xhr.upload.onprogress = function (event) {
      if (event.lengthComputable && typeof setProgress === "function") {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    };

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = xhr.response;
        if (res.success !== undefined && res.message) {
          userNotification(res.success ? "success" : "error", res.message);
        }
        resolve(res);
      } else {
        userNotification("error", `Upload failed with status ${xhr.status}`);
        reject(xhr.statusText);
      }
    };

    xhr.onerror = function () {
      userNotification("error", "Network error during file upload");
      reject("Network error");
    };

    xhr.send(formData);
  });
}
