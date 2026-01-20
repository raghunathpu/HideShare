import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

function Download() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef(null);

  const [fileInfo, setFileInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState("");

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetch(`https://hideshare-backend.onrender.com/meta/${filename}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else
          setFileInfo({
            ...data,
            expiresAt: data.expiresAt
              ? new Date(data.expiresAt).getTime()
              : null
          });
      });
  }, [filename]);

  const remaining = () => {
    if (!fileInfo?.expiresAt) return "Permanent";
    const d = fileInfo.expiresAt - now;
    if (d <= 0) return "Expired";
    return `${Math.floor(d / 60000)}m ${Math.floor((d % 60000) / 1000)}s`;
  };

  const download = async () => {
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;
    if (password) url += `?password=${password}`;
    window.open(url, "_blank");
  };

  if (error) return <p>{error}</p>;
  if (!fileInfo) return <p>Loading...</p>;

  const link = `https://hideshare.vercel.app/download/${filename}`;

  return (
    <div style={{ maxWidth: 500, margin: "40px auto" }}>
      <h2>{fileInfo.originalName}</h2>
      <p>Expires in: {remaining()}</p>

      <input
        type="password"
        placeholder="Password (if any)"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={download} disabled={remaining() === "Expired"}>
        Download
      </button>

      <div ref={qrRef} style={{ marginTop: 20 }}>
        <QRCodeCanvas value={link} size={180} />
      </div>
    </div>
  );
}

export default Download;
