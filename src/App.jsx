import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import Chatbot from "./pages/Chatbot";
import CreateFlashcard from "./pages/CreateFlashcard";
import VocabPractice from "./pages/FlashcardPractice.jsx";
import Flashcard from "./pages/Flashcard";
import SignIn from "./pages/SignIn";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Vocab from "./pages/Vocab";
import VocabLevel from "./pages/VocabLevel";
import VocabMatching from "./pages/VocabMatching";
import VocabTest from "./pages/VocabTest";
import Grammar from "./pages/Grammar";
import GrammarLevel from "./pages/GrammarLevel";
import GrammarDetail from "./pages/GrammarDetail";
import GrammarPractice from "./pages/GrammarPractice";
import Diary from "./pages/Diary";
import DiaryDetail from "./pages/DiaryDetail";
import VocabTopic from "./pages/VocabTopic.jsx";
import PersonalStudyRoom from "./pages/PersonalStudyRoom";


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
        <Route path="/flashcard/folders/:folderId" element={<Flashcard />} />
        <Route path="/flashcard/edit/:setId" element={<CreateFlashcard />} />
        <Route path="/flashcard/vocab-practice/:id" element={<VocabPractice />} />

        <Route path="*" element={<Navigate to="/" />} />
        
        <Route path="/signin" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        {/* --- Vocab Routes --- */}
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/vocab/:level" element={<VocabLevel />} />
        <Route path="/vocab/topic/:topicId" element={<VocabTopic />} />
        <Route path="/vocab/practice/matching" element={<VocabMatching />} />
        <Route path="/vocab/practice/test" element={<VocabTest />} />

        {/* --- Grammar Routes --- */}
        <Route path="/grammar" element={<Grammar />} />
        <Route path="/grammar/practice" element={<GrammarPractice />} />
        <Route path="/grammar/:level" element={<GrammarLevel />} />
        <Route path="/grammar/:level/:grammarId" element={<GrammarDetail />} />

        {/* --- Diary Routes --- */}
        <Route path="/diary" element={<Diary />} />
        <Route path="/diary/:title" element={<DiaryDetail />} />

        {/* --- Personal Study Room Routes --- */}
        <Route path="/personal-study-room" element={<PersonalStudyRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
