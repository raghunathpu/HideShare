import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

function Download() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  /* ⏱ Tick every second */
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
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

  /* ⏳ Countdown formatter */
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

  /* ⬇ Download handler */
  const download = async () => {
    setLoading(true);

    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) url += `?password=${encodeURIComponent(password)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const msg = await res.text();
        alert(msg);
        setLoading(false);
        setTimeout(() => navigate("/"), 3000);
        return;
      }
      window.open(url, "_blank");
    } catch {
      alert("Download failed");
    }

    setLoading(false);
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
    return (
      <p style={{ color: "red", textAlign: "center" }}>
        {error}
      </p>
    );
  }

  if (!fileInfo) {
    return <p style={{ textAlign: "center" }}>Loading…</p>;
  }

  const frontendLink = `https://hideshare.vercel.app/download/${filename}`;

  return (
    <div style={{ padding: "10px" }}>
      <div style={{ maxWidth: 500, margin: "40px auto", fontFamily: "Arial" }}>
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
          style={{ width: "100%", padding: 8 }}
        />

        <br /><br />

        <button
          onClick={download}
          disabled={expiryText === "Expired" || loading}
          style={{
            opacity: expiryText === "Expired" ? 0.5 : 1,
            cursor: expiryText === "Expired" ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Downloading..." : "Download"}
        </button>

        <p style={{ color: "orange", marginTop: 10 }}>
          ⚠ This file can be downloaded only once
        </p>

        <p style={{ fontSize: 12, wordBreak: "break-all" }}>
          {frontendLink}
        </p>

        {/* 📱 QR CODE */}
        {expiryText !== "Expired" && (
          <div
            ref={qrRef}
            style={{
              marginTop: 25,
              textAlign: "center",
              borderTop: "1px solid #ddd",
              paddingTop: 15
            }}
          >
            <p>📱 Scan QR to download</p>

            <QRCodeCanvas
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
          <p style={{ color: "red", marginTop: 10 }}>
            ❌ Link expired. Redirecting…
          </p>
        )}
      </div>
    </div>
  );
}

export default Download;
