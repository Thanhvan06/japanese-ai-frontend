import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Chatbot from "./pages/Chatbot";
import CreateFlashcard from "./pages/CreateFlashcard";
import VocabPractice from "./pages/VocabPractice";
import Flashcard from "./pages/Flashcard";
import SignIn from "./pages/SignIn";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Vocab from "./pages/Vocab";
import VocabLevel from "./pages/VocabLevel";
import Grammar from "./pages/Grammar";
import GrammarLevel from "./pages/GrammarLevel";
import GrammarDetail from "./pages/GrammarDetail";
import Diary from "./pages/Diary";
import DiaryDetail from "./pages/DiaryDetail";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/chatbot" element={<Chatbot />} />

        {/* --- Flashcard Routes --- */}
        <Route path="/flashcard" element={<Flashcard />} />
        <Route path="/flashcard/newflashcard" element={<CreateFlashcard />} />
        <Route path="/flashcard/folders/:folderName" element={<Flashcard />} />
        <Route path="/flashcard/vocab-practice/:id" element={<VocabPractice />} />

        <Route path="*" element={<Navigate to="/" />} />
        
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* --- Vocab Routes --- */}
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/vocab/:level" element={<VocabLevel />} />

        {/* --- Grammar Routes --- */}
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/grammar/:level" element={<GrammarLevel />} />
        <Route path="/grammar/:level/:grammarId" element={<GrammarDetail />} />

        {/* --- Diary Routes --- */}
        <Route path="/diary" element={<Diary />} />
        <Route path="/diary/:title" element={<DiaryDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
