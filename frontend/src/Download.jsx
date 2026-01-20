import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Download() {
  const { filename } = useParams();
  const navigate = useNavigate();

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

  /* 📡 Fetch file metadata */
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


  /* 🔁 Auto-redirect when expired */
  useEffect(() => {
    if (expiryText === "Expired") {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000); // redirect after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [expiryText, navigate]);

  /* ⬇ Download handler */
  const download = async () => {
  let url = `https://hideshare-backend.onrender.com/download/${filename}`;

  if (password) {
    url += `?password=${encodeURIComponent(password)}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
  const text = await res.text();
  alert(text);

  // 🔁 redirect back to upload after 3s
  setTimeout(() => {
    navigate("/");
  }, 3000);

  return;
}


    window.open(url, "_blank");
  } catch {
    alert("Download failed");
  }
};


  /* ❌ Error state */
  if (error) {
    return (
      <p style={{ color: "red", textAlign: "center" }}>
        {error}
      </p>
    );
  }

  /* ⏳ Loading state */
  if (!fileInfo) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

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

      {/* 🔒 Password input (always safe to show) */}
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

      {expiryText === "Expired" && (
        <p style={{ color: "red", marginTop: "10px" }}>
          ❌ Link expired. Redirecting…
        </p>
      )}
      <p style={{ color: "orange" }}>
  ⚠ This file can be downloaded only once
</p>

    </div>
  );
}

export default Download;
