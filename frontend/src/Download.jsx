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

  /* 🌗 Theme */
  useEffect(() => {
    document.title = "Download File – HideShare";
    const saved = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

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

  /* 📡 Metadata */
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND}/meta/${filename}`)
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

  const download = () => {
  let url = `${import.meta.env.VITE_BACKEND}/download/${filename}`;
  if (password) url += `?password=${encodeURIComponent(password)}`;

  // ONE request only → backend counter correct
  window.location.href = url;
};


  if (error)
    return (
      <div className="page">
        <div className="card">
          <p className="error">{error}</p>
          <button onClick={() => navigate("/")}>Go Back</button>
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
    style={{ height: "40px" }}
  />
</div>


        <p><strong>File:</strong> {fileInfo.originalName}</p>
        <p><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>

        <div className="divider" />

        <p>
          Expires in:{" "}
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
          {downloading ? "Downloading…" : "Download"}
        </button>

        <p className="warning">
          Download limit is enforced securely
        </p>
      </div>
    </div>
  );
}

export default Download;
