import React, { useState } from "react";

export default function DocumentUploader() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("document", file);

    try {
      setUploading(true);
      const response = await fetch("http://localhost:3000/api/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setMessage("✅ File uploaded successfully!");
        setUploadedFile(data);
      } else {
        setMessage("❌ Upload failed.");
      }
    } catch (error) {
      setMessage("⚠️ Something went wrong during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-uploader">
      <h2>📤 Upload a Document</h2>
      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {message && <p>{message}</p>}

      {uploadedFile && (
        <div>
          <p><strong>File Name:</strong> {uploadedFile.fileName}</p>
          <a href={`http://localhost:3000${uploadedFile.fileUrl}`} target="_blank" rel="noreferrer">
            View Uploaded File
          </a>
        </div>
      )}
    </div>
  );
}
