import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("10m");
  const [maxDownloads, setMaxDownloads] = useState(1);
  const [uploadResult, setUploadResult] = useState(null);
  const [status, setStatus] = useState("");
  const [now, setNow] = useState(Date.now());

  const qrRef = useRef(null);

  /* ⏱ live timer */
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* 🌗 theme */
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

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
    formData.append("maxDownloads", maxDownloads);

    try {
      const res = await fetch(
        "https://hideshare-backend.onrender.com/upload",
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setUploadResult(data);
      setStatus("");
    } catch (e) {
      setStatus("❌ Upload failed");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(uploadResult.downloadLink);
    alert("Link copied");
  };

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "HideShare-QR.png";
    a.click();
  };

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return "Permanent";
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";
    return `${Math.floor(diff / 60000)}m ${Math.floor(
      (diff % 60000) / 1000
    )}s`;
  };

  const expiryText = uploadResult
    ? formatExpiry(uploadResult.expiresAt)
    : "";

  return (
    <div className="page">
      <div className="card">
       <button className="theme-toggle" onClick={toggleTheme}>
  {document.documentElement.getAttribute("data-theme") === "dark"
    ? "Light"
    : "Dark"}
</button>





        <h2>HideShare</h2>

        <div
          className="drop-box"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
        >
          {file ? <strong>{file.name}</strong> : <p>📁 Drag & drop file</p>}
        </div>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <input
          type="password"
          placeholder="🔒 Optional password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>
          <strong>⏳ Link expiry</strong>
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
            <option value="10m">10 minutes</option>
            <option value="20m">20 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="permanent">Permanent</option>
          </select>
        </label>

        <label>
          <strong>📥 Max downloads</strong>
          <select
            value={maxDownloads}
            onChange={(e) => setMaxDownloads(Number(e.target.value))}
          >
            <option value={1}>1 (secure)</option>
            <option value={2}>2</option>
            <option value={5}>5</option>
            <option value={9999}>Unlimited</option>
          </select>
        </label>

        <button onClick={handleUpload}>🚀 Upload</button>
        {status && <p className="warning">{status}</p>}

        {uploadResult && (
          <>
            <div className="divider" />
            <p className="success">✅ Upload successful</p>
            <p>⏳ Expires in: <strong>{expiryText}</strong></p>

            <button onClick={copyLink}>📋 Copy Link</button>

            <div className="qr-box" ref={qrRef} style={{ textAlign: "center" }}>
              <p>📱 Scan QR to download</p>
              <QRCodeCanvas
                value={uploadResult.downloadLink}
                size={180}
                level="H"
                includeMargin
              />
              <button style={{ marginTop: 10 }} onClick={downloadQR}>
                ⬇ Download QR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Upload;
