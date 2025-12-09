export default function uploadPatientFile(url, files, other_req_data, token) {
  const mimetypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/dicom",
    "text/plain",
  ]);

  const maxSizeInBytes = 20 * 1024 * 1024; // 20MB

  // Files can be FileList or array
  const fileArray = Array.isArray(files) ? files : [files];

  // Validate each file
  for (const file of fileArray) {
    if (!mimetypes.has(file.type)) {
      return userNotification("error", `${file.name} has an invalid file type.`);
    }

    if (file.size > maxSizeInBytes) {
      return userNotification("error", `${file.name} exceeds 20MB size limit.`);
    }
  }

  const perms_requested = "Modify Patient Files";

  let formData = new FormData();

  // Append all files under the same key: "patient_file"
  fileArray.forEach((file) => {
    formData.append("patient_file", file);
  });

  // Push extra data
  for (const key in other_req_data) {
    if (other_req_data[key] !== undefined && other_req_data[key] !== null) {
      formData.append(key, other_req_data[key]);
    }
  }

  fetch(`${process.env.APIKEY}/${url}?perms_requested=${perms_requested}`, {
    method: "POST",
    mode: "cors",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then(async (res) => {
      const contentType = res.headers.get("Content-Type")?.split(";")[0];

      if (contentType === "application/json") {
        return { type: "json", data: await res.json() };
      }

      return { type: "file", data: await res.blob() };
    })
    .then((response) => {
      if (response.type === "json") {
        const result = response.data;
        return userNotification(result.success ? "success" : "error", result.message);
      }

      // other blob handler if necessary
    })
    .catch((err) => {
      console.error("Error Uploading Files", err);
      userNotification("error", "Error Uploading Files");
    });
}
