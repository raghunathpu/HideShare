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
  const [downloading, setDownloading] = useState(false);

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

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/meta/${filename}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then((data) => {
        setFileInfo({
          ...data,
          expiresAt: data.expiresAt
            ? new Date(data.expiresAt).getTime()
            : null
        });
      })
      .catch((e) => setError(e.message));
  }, [filename]);

  const expiryText = (() => {
    if (!fileInfo?.expiresAt) return "Permanent";
    const diff = fileInfo.expiresAt - now;
    if (diff <= 0) return "Expired";
    return `${Math.floor(diff / 60000)}m ${Math.floor(
      (diff % 60000) / 1000
    )}s`;
  })();

  useEffect(() => {
    if (expiryText === "Expired") {
      setTimeout(() => navigate("/"), 5000);
    }
  }, [expiryText, navigate]);

  const download = async () => {
    setDownloading(true);
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) url += `?password=${encodeURIComponent(password)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      window.open(url, "_blank");
    } catch (e) {
      alert(e.message);
    }
    setDownloading(false);
  };

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "HideShare-QR.png";
    a.click();
  };

  if (error)
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error}</p>
        </div>
      </div>
    );

  if (!fileInfo)
    return (
      <div className="page">
        <div className="card">
          <p>Loading…</p>
        </div>
      </div>
    );

  const frontendLink = `https://hideshare.vercel.app/download/${filename}`;

  return (
    <div className="page">
      <div className="card">
        <button className="theme-toggle" onClick={toggleTheme}>
          🌙 / ☀️
        </button>

        <h2>Download File</h2>

        <p><strong>📄 File:</strong> {fileInfo.originalName}</p>
        <p><strong>📦 Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>

        <div className="divider" />

        <p>
          ⏳ <strong>Expires in:</strong>{" "}
          <span className={expiryText === "Expired" ? "error" : ""}>
            {expiryText}
          </span>
        </p>

        <input
          type="password"
          placeholder="🔒 Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={download}
          disabled={expiryText === "Expired" || downloading}
        >
          {downloading ? "Downloading…" : "⬇ Download"}
        </button>

        {expiryText !== "Expired" && (
          <>
            <div className="divider" />
            <div className="qr-box" ref={qrRef} style={{ textAlign: "center" }}>
              <p>📱 Scan QR</p>
              <QRCodeCanvas
                value={frontendLink}
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

export default Download;
