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
      setStatus("");
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
  const formatExpiry = (expiresAt) => {
  if (!expiresAt) return "Permanent";

  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return "Expired";

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return `${mins}m ${secs}s`;
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

      <label style={{ display: "block", marginTop: "10px" }}>
  <strong>Link expiry</strong>
  <br />
  <select
    value={expiry}
    onChange={(e) => setExpiry(e.target.value)}
    style={{ width: "100%", padding: "8px", marginTop: "5px" }}
  >
    <option value="10m">Expire in 10 minutes</option>
    <option value="20m">Expire in 20 minutes</option>
    <option value="30m">Expire in 30 minutes</option>
    <option value="1h">Expire in 1 hour</option>
    <option value="permanent">Permanent</option>
  </select>
</label>

<br />

      <button onClick={handleUpload}>Upload</button>

      {status && <p>{status}</p>}

      {uploadResult && (
  <div style={{ marginTop: "20px" }}>
    <p>✅ Upload successful</p>

    <p>
      ⏳ Expires in:{" "}
      <strong>{formatExpiry(uploadResult.expiresAt)}</strong>
    </p>

    {uploadResult.passwordProtected && (
      <p>🔒 Password protected</p>
    )}

    <button onClick={copyLink}>Copy Link</button>
  </div>
)}

    </div>
  );
}

export default Upload;
