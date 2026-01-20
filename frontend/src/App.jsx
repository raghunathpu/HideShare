import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("10m");   // ✅ NEW
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
    formData.append("expiry", expiry); // ✅ SEND EXPIRY

    try {
      const res = await fetch("https://hideshare-backend.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setUploadResult(data);
      setStatus("✅ Upload successful");
    } catch {
      setStatus("❌ Upload failed");
    }
  };

  const copyLink = () => {
    if (!uploadResult || !uploadResult.downloadLink) {
      alert("Download link not ready yet");
      return;
    }

    const filename = uploadResult.downloadLink.split("/").pop();
    const frontendLink = `https://hideshare.vercel.app/download/${filename}`;

    navigator.clipboard.writeText(frontendLink)
      .then(() => alert("Link copied to clipboard"))
      .catch(() => alert("Failed to copy link"));
  };

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>HideShare</h2>

      {/* Drag & Drop */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setFile(e.dataTransfer.files[0]);
        }}
        style={{
          border: "2px dashed #aaa",
          padding: "30px",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        {file ? <p>📄 {file.name}</p> : <p>Drag & drop file here</p>}
      </div>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br /><br />

      <input
        type="password"
        placeholder="Optional upload password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      {/* ✅ EXPIRY SELECT */}
      <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
        <option value="10m">Expire in 10 minutes</option>
        <option value="20m">Expire in 20 minutes</option>
        <option value="30m">Expire in 30 minutes</option>
        <option value="1h">Expire in 1 hour</option>
        <option value="permanent">Permanent</option>
      </select>

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      {status && <p>{status}</p>}

      {uploadResult && (
        <div style={{ marginTop: "30px" }}>
          <p>✅ Upload successful</p>
          <button onClick={copyLink}>Copy Link</button>
        </div>
      )}
    </div>
  );
}

export default App;
