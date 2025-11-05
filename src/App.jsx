import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Chatbot from "./pages/Chatbot";
import CreateFlashcard from "./pages/CreateFlashcard";
import VocabPractice from "./pages/VocabPractice";
import Flashcard from "./pages/Flashcard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/newflashcard" element={<CreateFlashcard />} />
        <Route path="/vocab-practice" element={<VocabPractice />} />
        <Route path="/flashcard" element={<Flashcard />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
