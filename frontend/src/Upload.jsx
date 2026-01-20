import { useState } from "react";

function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("10m");
  const [uploadResult, setUploadResult] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("❌ Please select a file");
      return;
    }

    setStatus("⏳ Uploading...");

    const formData = new FormData();
    formData.append("file", file);
    if (password) formData.append("password", password);
    formData.append("expiry", expiry);

    try {
      const res = await fetch(
        "https://hideshare-backend.onrender.com/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      setUploadResult(data);
      setStatus("✅ Upload successful");
    } catch {
      setStatus("❌ Upload failed");
    }
  };

  const copyLink = () => {
    const filename = uploadResult.downloadLink.split("/").pop();
    const frontendLink = `https://hideshare.vercel.app/download/${filename}`;
    navigator.clipboard.writeText(frontendLink);
    alert("Link copied");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>HideShare</h2>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setFile(e.dataTransfer.files[0]);
        }}
        style={{ border: "2px dashed #aaa", padding: "30px" }}
      >
        {file ? <p>{file.name}</p> : <p>Drag & drop file</p>}
      </div>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />

      <input
        type="password"
        placeholder="Optional password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
        <option value="10m">10 minutes</option>
        <option value="20m">20 minutes</option>
        <option value="30m">30 minutes</option>
        <option value="1h">1 hour</option>
        <option value="permanent">Permanent</option>
      </select>

      <br /><br />
      <button onClick={handleUpload}>Upload</button>

      {status && <p>{status}</p>}

      {uploadResult && (
        <>
          <p>Upload successful</p>
          <button onClick={copyLink}>Copy Link</button>
        </>
      )}
    </div>
  );
}

export default Upload;
