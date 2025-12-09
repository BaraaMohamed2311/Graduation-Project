import { useRef } from "react";
import styles from "./FileUploadButton.module.css"
function FileUploadButton({ onFileSelect }) {
  const fileInputRef = useRef(null);

  // Trigger click on hidden input
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Handle selected file
  const handleFileChange = (e) => {
    const file = e.target.files[0]; // single file
    if (file) onFileSelect(file);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className={styles["add-file-button"]}
      >
        Upload File
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
        accept="*" // optional: e.g., "image/*,.pdf"
      />
    </>
  );
}

export default FileUploadButton