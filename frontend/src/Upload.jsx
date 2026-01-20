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

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
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
    formData.append("maxDownloads", maxDownloads);

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
        <h2>HideShare</h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setFile(e.dataTransfer.files[0]);
          }}
          className="dropzone"
        >
          {file ? <strong>{file.name}</strong> : "Drag & drop file here"}
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

        <button onClick={handleUpload}>Upload</button>

        {status && <p className="warning">{status}</p>}

        {uploadResult && (
          <>
            <div className="divider" />
            <p className="success">✅ Upload successful</p>
            <p>⏳ Expires in: <strong>{expiryText}</strong></p>

            <button className="secondary-btn" onClick={copyLink}>
              Copy Link
            </button>

            <div ref={qrRef} className="qr-box">
              <QRCodeCanvas
                value={uploadResult.downloadLink}
                size={180}
                level="H"
                includeMargin
              />
              <button
                className="secondary-btn"
                style={{ marginTop: 10 }}
                onClick={downloadQR}
              >
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
