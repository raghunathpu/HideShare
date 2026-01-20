import { Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import Download from "./Download";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Upload />} />
      <Route path="/download/:filename" element={<Download />} />
    </Routes>
  );
}

export default App;
