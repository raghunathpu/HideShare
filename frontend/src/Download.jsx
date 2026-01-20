const [maxDownloads, setMaxDownloads] = useState(1);
import { useState, useEffect } from "react";
function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("10m");
  const [uploadResult, setUploadResult] = useState(null);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());

  // ⏱ Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // ⏳ Countdown formatter
  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return "Permanent";

    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const expiryText = uploadResult
    ? formatExpiry(uploadResult.expiresAt)
    : "";

  // 🔄 Auto-reset after expiry
  useEffect(() => {
    if (expiryText === "Expired") {
      setTimeout(() => {
        setUploadResult(null);
        setFile(null);
        setPassword("");
        setExpiry("10m");
      }, 2000);
    }
  }, [expiryText]);

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

      <label>
        <strong>Link expiry</strong>
        <select
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        >
          <option value="10m">10 minutes</option>
          <option value="20m">20 minutes</option>
          <option value="30m">30 minutes</option>
          <option value="1h">1 hour</option>
          <option value="permanent">Permanent</option>
        </select>
      </label>

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      {status && <p>{status}</p>}

      {uploadResult && (
        <div style={{ marginTop: "20px" }}>
          <p>✅ Upload successful</p>

          <p>
            ⏳ Expires in: <strong>{expiryText}</strong>
          </p>

          {uploadResult.passwordProtected && <p>🔒 Password protected</p>}

          {expiryText === "Expired" ? (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ❌ Link expired. Resetting…
            </p>
          ) : (
            <button onClick={copyLink}>Copy Link</button>
          )}
        </div>
      )}
    </div>
  );
}

export default Upload;
