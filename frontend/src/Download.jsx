import { useParams } from "react-router-dom";
import { useState } from "react";

function Download() {
  const { filename } = useParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const download = () => {
    let url = `https://hideshare-backend.onrender.com/download/${filename}`;

    if (password) {
      url += `?password=${encodeURIComponent(password)}`;
    }

    window.open(url, "_blank");
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h2>Password Required</h2>

      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={download}>Download</button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

export default Download;
