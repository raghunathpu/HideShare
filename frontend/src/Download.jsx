import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Download() {
  const { filename } = useParams();

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now()); // 🔥 ticking state

  // calculate remaining time
  const getRemainingTime = (expiresAt, now) => {
    if (!expiresAt) return "Permanent";

    const diff = expiresAt - now;
    if (diff <= 0) return "Expired";

    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return `${mins}m ${secs}s`;
  };

  // fetch metadata once
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

  // tick every second (FORCE RE-RENDER)
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const download = () => {
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) {
      url += `?password=${encodeURIComponent(password)}`;
    }
    window.open(url, "_blank");
  };

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!fileInfo) {
    return <p>Loading...</p>;
  }

  const timeLeft = getRemainingTime(fileInfo.expiresAt, now);

  return (
    <div style={{ maxWidth: "500px", margin: "40px auto", fontFamily: "Arial" }}>
      <h2>Download File</h2>

      <p><strong>File:</strong> {fileInfo.originalName}</p>
      <p><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(2)} KB</p>

      <p>
        ⏳ <strong>Expires in:</strong>{" "}
        <span style={{ color: timeLeft === "Expired" ? "red" : "black" }}>
          {timeLeft}
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
        disabled={timeLeft === "Expired"}
        style={{
          opacity: timeLeft === "Expired" ? 0.5 : 1,
          cursor: timeLeft === "Expired" ? "not-allowed" : "pointer"
        }}
      >
        Download
      </button>
    </div>
  );
}

export default Download;
