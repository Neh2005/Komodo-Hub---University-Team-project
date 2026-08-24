
// **** CHALITHA's PART ***** //

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { useNavigate, Link } from "react-router-dom";
import { getGravatarUrl } from "../utils/avatar";
import "./StudentInformation.css"; // ✅ Ensure styling matches the given CSS

const StudentInformation = () => {
  const [teacher, setTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();


  useEffect(() => {

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.error("❌ No user logged in! Redirecting...");
        navigate("/login");
        return;
      }


      const teacherRef = doc(db, `users/teacher/members/${user.uid}`);


      try {
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          setTeacher(teacherData);

          // ✅ Fetch students after getting teacher's class ID
          fetchStudents(teacherData.classID);
        } else {
          console.error("❌ No teacher data found!");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Error fetching teacher data:", error);
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [navigate]);

  const fetchStudents = async (classID) => {
    if (!classID) return;


    try {
      const studentsQuery = query(collection(db, "users/student/members"), where("classID", "==", classID));
      const studentsSnapshot = await getDocs(studentsQuery);
      let allStudents = [];

      studentsSnapshot.forEach((doc) => {
        const studentData = doc.data();
        const completed = studentData.completedAssignments || 0;
        const incomplete = studentData.incompleteAssignments || 0;
        const progress = (completed / (completed + incomplete)) * 100 || 0;

        allStudents.push({
          studentId: studentData.studentId,
          name: studentData.name,
          email: studentData.email || "N/A",
          progress: progress.toFixed(2) + "%",
        });
      });

      setStudents(allStudents);
    } catch (error) {
      console.error("❌ Error fetching students:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="information-dashboard-container">
      {isLoading ? (
        <p>Loading students...</p>
      ) : (
        <>
          {/* Sidebar */}
          <div className="information-sidebar">
            <ul className="information-nav-links">
              <li className="information-profile">
                <img src={teacher?.avatar || getGravatarUrl(teacher?.email) || "images/user.png"} alt="Teacher Profile" />
                <span>{teacher?.name || "Teacher"}</span>
              </li>
              <li><Link to="/studentinformation"><i className="fas fa-chalkboard-teacher"></i> Students</Link></li>
              <li><Link to="/grading"><i className="fas fa-file-alt"></i> Grade Assignments</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}><i className="fas fa-calendar"></i> Announcements</a></li>
            </ul>
            <div className="information-bottom-buttons">
              <button className="information-back-dashboard-btn" onClick={() => navigate("/teacher-dashboard")}>
                🔙 Back to Dashboard
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="information-content-wrapper">
            <div className="information-main-content">
              <h2>📌 Student Progress</h2>

              {students.length > 0 ? (
                <table className="student-information-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Email</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.studentId}>
                        <td>{student.name}</td>
                        <td>{student.studentId}</td>
                        <td>{student.email}</td>
                        <td>{student.progress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No students found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentInformation;
