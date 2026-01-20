import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode.react";

function Download() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  /* ⏱ Tick every second */
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* 📡 Fetch metadata */
  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/meta/${filename}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setFileInfo({
            ...data,
            expiresAt: data.expiresAt
              ? new Date(data.expiresAt).getTime()
              : null
          });
        }
      })
      .catch(() => setError("Failed to load file info"));
  }, [filename]);

  /* ⏳ Countdown */
  const formatExpiry = () => {
    if (!fileInfo?.expiresAt) return "Permanent";

    const diff = fileInfo.expiresAt - now;
    if (diff <= 0) return "Expired";

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  const expiryText = formatExpiry();

  /* 🔁 Redirect after expiry */
  useEffect(() => {
    if (expiryText === "Expired") {
      const t = setTimeout(() => navigate("/"), 5000);
      return () => clearTimeout(t);
    }
  }, [expiryText, navigate]);

  /* ⬇ Download */
  const download = async () => {
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) url += `?password=${encodeURIComponent(password)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const msg = await res.text();
        alert(msg);
        setTimeout(() => navigate("/"), 3000);
        return;
      }
      window.open(url, "_blank");
    } catch {
      alert("Download failed");
    }
  };

  /* 📥 Download QR */
  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "HideShare-QR.png";
    a.click();
  };

  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }

  if (!fileInfo) {
    return <p style={{ textAlign: "center" }}>Loading…</p>;
  }

  const frontendLink = `https://hideshare.vercel.app/download/${filename}`;

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Download File</h2>

      <p><strong>File:</strong> {fileInfo.originalName}</p>
      <p><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>

      <p>
        ⏳ <strong>Expires in:</strong>{" "}
        <span style={{ color: expiryText === "Expired" ? "red" : "black" }}>
          {expiryText}
        </span>
      </p>

      <input
        type="password"
        placeholder="Enter password (if required)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px" }}
      />

      <br /><br />

      <button
        onClick={download}
        disabled={expiryText === "Expired"}
        style={{
          opacity: expiryText === "Expired" ? 0.5 : 1,
          cursor: expiryText === "Expired" ? "not-allowed" : "pointer"
        }}
      >
        Download
      </button>

      <p style={{ color: "orange", marginTop: "10px" }}>
        ⚠ This file can be downloaded only once
      </p>

      {/* 📱 QR CODE */}
      {expiryText !== "Expired" && (
        <div style={{ marginTop: "25px", textAlign: "center" }} ref={qrRef}>
          <p>📱 Scan QR to download</p>
          <QRCode
            value={frontendLink}
            size={180}
            level="H"
            includeMargin
          />

          <br /><br />
          <button onClick={downloadQR}>Download QR</button>
        </div>
      )}

      {expiryText === "Expired" && (
        <p style={{ color: "red", marginTop: "10px" }}>
          ❌ Link expired. Redirecting…
        </p>
      )}
    </div>
  );
}

export default Download;
