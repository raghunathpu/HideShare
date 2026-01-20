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

  // tick every second
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

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return "Permanent";
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";
    return `${Math.floor(diff / 60000)}m ${Math.floor(
      (diff % 60000) / 1000
    )}s`;
  };

  return (
    <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "Arial" }}>
      <h2>HideShare</h2>

      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <br /><br />

      <input
        type="password"
        placeholder="Optional password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br /><br />

      <select value={expiry} onChange={e => setExpiry(e.target.value)}>
        <option value="10m">10 minutes</option>
        <option value="20m">20 minutes</option>
        <option value="30m">30 minutes</option>
        <option value="1h">1 hour</option>
        <option value="permanent">Permanent</option>
      </select>
      <br /><br />

      <select
        value={maxDownloads}
        onChange={e => setMaxDownloads(Number(e.target.value))}
      >
        <option value={1}>1 time</option>
        <option value={2}>2 times</option>
        <option value={5}>5 times</option>
        <option value={9999}>Unlimited</option>
      </select>
      <br /><br />

      <button onClick={handleUpload}>Upload</button>
      {status && <p>{status}</p>}

      {uploadResult && (
        <div ref={qrRef} style={{ marginTop: 20, textAlign: "center" }}>
          <p>✅ Upload successful</p>
          <p>⏳ Expires in: {formatExpiry(uploadResult.expiresAt)}</p>
          <button onClick={copyLink}>Copy Link</button>

          <QRCodeCanvas value={uploadResult.downloadLink} size={180} />
          <br />
          <button onClick={downloadQR}>Download QR</button>
        </div>
      )}
    </div>
  );
}

export default Upload;
