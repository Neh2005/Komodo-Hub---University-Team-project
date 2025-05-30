import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";// Neha's part
import 'bootstrap/dist/css/bootstrap.min.css';// Neha's part
import "@fortawesome/fontawesome-free/css/all.min.css"; // Neha's part
import Header from "./components/Header.jsx"; // Revan's part
import Footer from "./components/Footer.jsx";//Dhanya's part
import Home from "./pages/Home.jsx"; //Dhanya's part
import Login from "./pages/Login";//Dhanya's part
import Signup from "./pages/Signup";// Revan's part
import Profile from "./pages/Profile";// Maneesh's part
import StudentDashboard from "./components/StudentDashboard.jsx"; //Neha's part
import Library from "./components/Library.jsx";//Maneesh' part
import Posts from "./components/Posts.jsx"; // Dhanya's part
import DiscussionForum from "./components/DiscussionForum.jsx"; // Revan's part
import Wildlife from "./components/Wildlife.jsx";// Karmugilan's part
import StudentTimetable from "./components/StudentTimetable"; // Karmugilan's part
import Messages from "./components/Messages.jsx";// Neha's part
import TeacherDashboard from "./components/TeacherDashboard.jsx"; // Chalitha's part
import StudentAssignment from "./components/AssignmentStudent.jsx";// Neha's part
import TeacherAssignment from "./components/TeacherAssignment.jsx"; // Chalitha's part
import GradeAssignment from "./components/GradeAssignment.jsx";// Maneesh's part
import AdminDashboard from "./components/AdminDashboard.jsx";// Neha's part
import AdminMessages from "./components/Adminmessages.jsx";// Neha's part
import Helperbot from "./components/Chatbot.jsx";// Neha's part
import StudentInformation from "./components/StudentInformation.jsx"; // Chalitha's part
import Quiz from "./components/Quiz.jsx";// Maneesh's part
import Quiz1 from "./components/Quiz1.jsx"; // Mugilan's part


{/* Neha's part*/}
function AppContent() {
  const location = useLocation(); // Get the current route

  // Hide Header and Footer ONLY on Signup, Login, and Profile pages - /* Neha's part*/
  const hideHeaderFooter = ["/signup", "/login", "/profile","/studentdashboard","/messages","/admin-messages","/library","/quiz", "/quiz1","/posts","/discussionforum","/wildlife","/timetable", "/teacher-dashboard","/teacherassignment","/studentinformation","/assignments","/grading","/admin-dashboard"].includes(location.pathname);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <Routes>
        
        <Route path="/" element={<Home />} /> {/* Dhanya's part*/}
        <Route path="/login" element={<Login />} />{/* Dhanya's part*/}
        <Route path="/signup" element={<Signup />} /> {/* Revan's part*/}
        <Route path="/profile" element={<Profile />} />{/* Maneesh's part*/}
        <Route path="/library" element={<Library />} />{/* Maneesh's part*/}
        <Route path="/posts" element={<Posts />} />{/* Dhanya's part*/}
        <Route path="/studentdashboard" element={<StudentDashboard />} /> {/* Neha's part*/}
        <Route path="/discussionforum" element={<DiscussionForum />} />{/* Revan's part*/}
        <Route path="/wildlife" element={<Wildlife />} />{/* Karmugilan's part*/}
        <Route path="/timetable" element={<StudentTimetable />} />{/* Karmugilan's part*/}
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} /> {/* Chalitha's part*/}
        <Route path="/messages" element={<Messages />} /> {/* Neha's part*/}
        <Route path="/teacherassignment" element={<TeacherAssignment />} /> {/* Chalitha's part*/}
        <Route path="/assignments" element={<StudentAssignment />} /> {/* Chalitha's part*/}
        <Route path="/grading" element={<GradeAssignment />} /> {/* Maneesh's part*/}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />{/* Neha's part*/}
        <Route path="/admin-messages" element={<AdminMessages />} /> {/* Neha's part*/}
        <Route path="/quiz1" element={<Quiz1 />} /> {/* Karmugilan's part*/}
        <Route path="/quiz" element={<Quiz />} /> {/* Maneesh's part*/}
        <Route path="/studentinformation" element={<StudentInformation />} /> {/* Chalitha's part*/}
        
      </Routes>
      {!hideHeaderFooter && <Footer />}
      <Helperbot />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
