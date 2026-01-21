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

  /* ⏱ Live clock */
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* 📡 Fetch metadata */
  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/meta/${filename}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "File not found");
        }
        return res.json();
      })
      .then((data) => {
        setFileInfo({
          ...data,
          expiresAt: data.expiresAt
            ? new Date(data.expiresAt).getTime()
            : null,
          downloads: data.downloads ?? 0,
          maxDownloads: data.maxDownloads ?? 1
        });
      })
      .catch((err) => {
        setError(err.message || "File not found");
      });
  }, [filename]);

  /* ⏳ Expiry text */
  const expiryText = (() => {
    if (!fileInfo?.expiresAt) return "Permanent";
    const diff = fileInfo.expiresAt - now;
    if (diff <= 0) return "Expired";
    return `${Math.floor(diff / 60000)}m ${Math.floor(
      (diff % 60000) / 1000
    )}s`;
  })();

  /* 🔁 Redirect after expiry */
  useEffect(() => {
    if (expiryText === "Expired") {
      const t = setTimeout(() => navigate("/"), 5000);
      return () => clearTimeout(t);
    }
  }, [expiryText, navigate]);

  /* ⬇ Download */
  const download = async () => {
    setDownloading(true);

    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) url += `?password=${encodeURIComponent(password)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const msg = await res.text();
        setDownloading(false);
        setError(msg);
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      window.open(url, "_blank");
    } catch {
      setError("Download failed");
    }

    setDownloading(false);
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

  /* ❌ Error */
  if (error) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">❌ {error}</p>
          <button onClick={() => navigate("/")}>⬅ Go Back</button>
        </div>
      </div>
    );
  }

  /* ⏳ Loading */
  if (!fileInfo) {
    return (
      <div className="page">
        <div className="card">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  const remaining =
    fileInfo.maxDownloads === 9999
      ? "Unlimited"
      : Math.max(fileInfo.maxDownloads - fileInfo.downloads, 0);

  const exhausted =
    fileInfo.maxDownloads !== 9999 &&
    fileInfo.downloads >= fileInfo.maxDownloads;

  const frontendLink = `https://hideshare.vercel.app/download/${filename}`;

  return (
    <div className="page">
      <div className="card">
        <h2>Download File</h2>

        <p><strong>📄 File:</strong> {fileInfo.originalName}</p>
        <p><strong>📦 Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>
        <p><strong>⬇ Remaining downloads:</strong> {remaining}</p>

        <div className="divider" />

        <p>
          ⏳ <strong>Expires in:</strong>{" "}
          <span className={expiryText === "Expired" ? "error" : ""}>
            {expiryText}
          </span>
        </p>

        <input
          type="password"
          placeholder="🔒 Enter password (if required)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={download}
          disabled={expiryText === "Expired" || exhausted || downloading}
        >
          {downloading ? "Downloading…" : "⬇ Download"}
        </button>

        {exhausted && (
          <p className="error">❌ Download limit reached</p>
        )}

        {expiryText !== "Expired" && !exhausted && (
          <>
            <div className="divider" />
            <div ref={qrRef} className="qr-box" style={{ textAlign: "center" }}>
              <p>📱 Scan QR to download</p>
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
