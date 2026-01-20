import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function Download() {
  const { filename } = useParams();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fileInfo, setFileInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  // Fetch file metadata
  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/file-info/${filename}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setFileInfo(data);
        }
      })
      .catch(() => setError("Failed to load file info"));
  }, [filename]);

  // Countdown timer
  useEffect(() => {
    if (!fileInfo || !fileInfo.expiresAt) return;

    const interval = setInterval(() => {
      const diff = new Date(fileInfo.expiresAt) - new Date();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fileInfo]);

  const download = () => {
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;

    if (password) {
      url += `?password=${encodeURIComponent(password)}`;
    }

    window.open(url, "_blank");
  };

  if (error) {
    return <p style={{ color: "red", padding: "40px" }}>{error}</p>;
  }

  if (!fileInfo) {
    return <p style={{ padding: "40px" }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: "400px", margin: "60px auto", fontFamily: "Arial" }}>
      <h2>Download File</h2>

      <p><strong>File:</strong> {fileInfo.originalName}</p>
      <p><strong>Size:</strong> {(fileInfo.size / 1024).toFixed(1)} KB</p>

      {fileInfo.expiresAt && (
        <p><strong>Expires in:</strong> ⏳ {timeLeft}</p>
      )}

      <br />

      <input
        type="password"
        placeholder="Enter password (if required)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={download}>Download</button>
    </div>
  );
}

export default Download;
