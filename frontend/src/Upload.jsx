import { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState("10m");
  const [maxDownloads, setMaxDownloads] = useState(1);
  const [uploadResult, setUploadResult] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [now, setNow] = useState(Date.now());

  const qrRef = useRef(null);

  /* 🌗 Load theme */
  useEffect(() => {
    document.title = "HideShare – Secure File Sharing";
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  /* 🌗 Toggle theme */
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  /* ⏱ Clock */
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* 📄 File icon */
  const fileIcon = () => {
    if (!file) return "FILE";
    if (file.type.startsWith("image")) return "IMG";
    if (file.type.startsWith("video")) return "VID";
    if (file.type.includes("pdf")) return "PDF";
    if (file.type.includes("zip")) return "ZIP";
    return "FILE";
  };

  /* ⬆ Upload */
  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a file");
      return;
    }

    setUploading(true);
    setStatus("Uploading...");
    setProgress(30);

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

      setProgress(80);
      const data = await res.json();
      setUploadResult(data);
      setProgress(100);
      setStatus("");
    } catch {
      setStatus("Upload failed");
    }

    setUploading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(uploadResult.downloadLink);
    setStatus("Link copied");
    setTimeout(() => setStatus(""), 2000);
  };

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "HideShare-QR.png";
    a.click();
  };

  const expiryText = uploadResult
    ? (() => {
        if (!uploadResult.expiresAt) return "Permanent";
        const diff = new Date(uploadResult.expiresAt).getTime() - now;
        if (diff <= 0) return "Expired";
        return `${Math.floor(diff / 60000)}m ${Math.floor(
          (diff % 60000) / 1000
        )}s`;
      })()
    : "";

  return (
    <div className="page">
      <div className="card">
        <button className="theme-toggle" onClick={toggleTheme}>
          {document.documentElement.getAttribute("data-theme") === "dark"
            ? "Light"
            : "Dark"}
        </button>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
  <img
    src="/logo.png"
    alt="HideShare"
    style={{ height: "48px", marginBottom: "6px" }}
  />
  <div style={{ color: "var(--muted)", fontSize: "14px" }}>
    Secure file sharing made simple
  </div>
</div>


        <div
          className="drop-box"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
        >
          {file ? (
            <>
              <div className="file-icon">{fileIcon()}</div>
              <strong>{file.name}</strong>
            </>
          ) : (
            "Drag & drop file"
          )}
        </div>

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <input
          type="password"
          placeholder="Optional password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>
          <strong>Link expiry</strong>
          <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
            <option value="10m">10 minutes</option>
            <option value="20m">20 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="permanent">Permanent</option>
          </select>
        </label>

        <label>
          <strong>Max downloads</strong>
          <select
            value={maxDownloads}
            onChange={(e) => setMaxDownloads(Number(e.target.value))}
          >
            <option value={1}>1 time</option>
            <option value={2}>2 times</option>
            <option value={5}>5 times</option>
            <option value={9999}>Unlimited</option>
          </select>
        </label>

        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </button>

        {uploading && (
          <div className="progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}

        {status && <p className="warning">{status}</p>}

        {uploadResult && (
          <>
            <div className="divider" />

            <p className="success">Upload successful</p>
            <p>Expires in: <strong>{expiryText}</strong></p>

            <button onClick={copyLink}>Copy Link</button>

            <div ref={qrRef} className="qr-box" style={{ textAlign: "center" }}>
              <p>Scan QR to download</p>
              <QRCodeCanvas
                value={uploadResult.downloadLink}
                size={180}
                level="H"
                includeMargin
              />
              <button style={{ marginTop: 10 }} onClick={downloadQR}>
                Download QR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Upload;
