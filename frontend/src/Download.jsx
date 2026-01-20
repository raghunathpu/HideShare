import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Download() {
  const { filename } = useParams();

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  // format countdown
  const getRemainingTime = (expiresAt) => {
  if (!expiresAt) return "Permanent";

  const diff = expiresAt - Date.now();
  if (diff <= 0) return "Expired";

  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return `${mins}m ${secs}s`;
};


  // fetch file metadata
  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/meta/${filename}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          const expiryTime = data.expiresAt ? new Date(data.expiresAt).getTime() : null;

setFileInfo({
  ...data,
  expiresAt: expiryTime
});
setTimeLeft(getRemainingTime(expiryTime));

        }
      })
      .catch(() => setError("Failed to load file info"));
  }, [filename]);

  // countdown timer
  useEffect(() => {
  if (!fileInfo || !fileInfo.expiresAt) return;

  const interval = setInterval(() => {
    setTimeLeft(getRemainingTime(fileInfo.expiresAt));
  }, 1000);

  return () => clearInterval(interval);
}, [fileInfo?.expiresAt]);

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
