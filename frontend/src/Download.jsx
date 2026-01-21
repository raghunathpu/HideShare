import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Download() {
  const { filename } = useParams();
  const navigate = useNavigate();

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [downloading, setDownloading] = useState(false);

  /* 🌗 Load saved theme */
  useEffect(() => {
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

  /* ⏱ Live clock */
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* 📡 Fetch file metadata */
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

  /* ⏳ Expiry countdown */
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
      if (!res.ok) throw new Error(await res.text());
      window.open(url, "_blank");
    } catch (e) {
      alert(e.message);
    }

    setDownloading(false);
  };

  /* ❌ Error */
  if (error) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error}</p>
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

  return (
    <div className="page">
      <div className="card">
        <button className="theme-toggle" onClick={toggleTheme}>
          {document.documentElement.getAttribute("data-theme") === "dark"
            ? "Light"
            : "Dark"}
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
          placeholder="Enter password (if required)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={download}
          disabled={expiryText === "Expired" || downloading}
        >
          {downloading ? "Downloading…" : "⬇ Download"}
        </button>

        <p className="warning">
          ⚠ This file can be downloaded only once
        </p>

        {expiryText === "Expired" && (
          <p className="error">❌ Link expired. Redirecting…</p>
        )}
      </div>
    </div>
  );
}

export default Download;
