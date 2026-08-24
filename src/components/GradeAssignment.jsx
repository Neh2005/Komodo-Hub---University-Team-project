
/* ****** Maneesh's part ******* */

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { useNavigate, Link } from "react-router-dom";
import { getGravatarUrl } from "../utils/avatar";
import { logAuditEvent } from "../utils/auditLog";
import "./GradeAssignment.css"; // ✅ Ensure styling matches the given CSS

const GradeAssignment = () => {
  const [teacher, setTeacher] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState({});
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

          // ✅ Fetch submissions after getting teacher's class ID
          fetchSubmissions(teacherData.classID);
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

  const fetchSubmissions = async (classID) => {
    if (!classID) return;


    try {
      const assignmentsQuery = query(collection(db, "assignments"), where("classID", "==", classID));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);

      // Flatten every (assignment, submission) pair first, then fetch all the student
      // names concurrently instead of one getDoc() at a time — for N assignments with M
      // submissions each, the old loop made N*M sequential round-trips before the page
      // could render at all. Also dedupes repeated lookups for the same student across
      // multiple assignments.
      const pairs = [];
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentData = assignmentDoc.data();
        for (const submission of assignmentData.submissionDetails || []) {
          pairs.push({ assignmentID: assignmentDoc.id, assignmentData, submission });
        }
      }

      const studentNameCache = new Map();
      await Promise.all(
        [...new Set(pairs.map((p) => p.submission.studentID))].map(async (studentID) => {
          const studentSnap = await getDoc(doc(db, `users/student/members/${studentID}`));
          studentNameCache.set(studentID, studentSnap.exists() ? studentSnap.data().name : "Unknown Student");
        })
      );

      const allSubmissions = pairs.map(({ assignmentID, assignmentData, submission }) => ({
        id: submission.studentID,
        studentName: studentNameCache.get(submission.studentID),
        assignmentTitle: assignmentData.title,
        submittedFile: submission.fileData,
        fileName: submission.fileName,
        marks: submission.marks || "",
        feedback: submission.feedback || "",
        assignmentID,
      }));

      setSubmissions(allSubmissions);
    } catch (error) {
      console.error("❌ Error fetching submissions:", error);
    }

    setIsLoading(false);
  };

  const gradeAssignment = async (assignmentID, studentID) => {
    const assignmentRef = doc(db, `assignments/${assignmentID}`);

    try {
      const assignmentSnap = await getDoc(assignmentRef);
      if (assignmentSnap.exists()) {
        const assignmentData = assignmentSnap.data();

        const updatedSubmissions = (assignmentData.submissionDetails || []).map((submission) => {
          if (submission.studentID === studentID) {
            return {
              ...submission,
              marks: grading[`${studentID}-${assignmentID}`]?.marks ?? submission.marks ?? "",
              feedback: grading[`${studentID}-${assignmentID}`]?.feedback ?? submission.feedback ?? "",
            };
          }
          return submission;
        });

        await updateDoc(assignmentRef, { submissionDetails: updatedSubmissions });

        const updatedEntry = updatedSubmissions.find((s) => s.studentID === studentID);
        logAuditEvent({
          action: "grade_assignment",
          actorUid: auth.currentUser?.uid,
          actorEmail: teacher?.email || auth.currentUser?.email || "",
          targetId: `${assignmentID}:${studentID}`,
          details: { marks: updatedEntry?.marks ?? "", assignmentTitle: assignmentData.title || "" },
        }).catch((err) => console.error("Audit log write failed:", err));

        alert("Grading updated successfully!");
        fetchSubmissions(teacher.classID);
      }
    } catch (error) {
      console.error("❌ Error updating grade:", error);
      alert("Failed to update grading.");
    }
  };

  return (
    <div className="grade-dashboard-container">
      {isLoading ? (
        <p>Loading submissions...</p>
      ) : (
        <>
          {/* Sidebar */}
          <div className="grade-sidebar">
            <ul className="grade-nav-links">
              <li className="grade-profile">
                <img src={teacher?.avatar || getGravatarUrl(teacher?.email) || "images/user.png"} alt="Teacher Profile" />
                <span>{teacher?.name || "Teacher"}</span>
              </li>
              <li><Link to="/studentinformation"><i className="fas fa-chalkboard-teacher"></i> Students</Link></li>
              <li><Link to="/grading"><i className="fas fa-file-alt"></i> Grade Assignments</Link></li>
              <li><a href="#" onClick={(e) => e.preventDefault()}><i className="fas fa-calendar"></i> Announcements</a></li>
            </ul>
            <div className="grading-bottom-buttons">
              <button className="grading-back-dashboard-btn" onClick={() => navigate("/teacher-dashboard")}>
                🔙 Back to Dashboard
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grade-content-wrapper">
            <div className="grade-main-content">
              <h2>📌 Student Submissions</h2>

              {submissions.length > 0 ? (
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Assignment Title</th>
                      <th>Student Name</th>
                      <th>Submission</th>
                      <th>Marks</th>
                      <th>Feedback</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td>{submission.assignmentTitle}</td>
                        <td>{submission.studentName}</td>
                        <td>
                          <a href={submission.submittedFile} download={submission.fileName}>
                            📎 {submission.fileName || "Download Submission"}
                          </a>
                        </td>
                        <td>
                          <input
                            type="number"
                            placeholder="Marks"
                            value={grading[`${submission.id}-${submission.assignmentID}`]?.marks ?? submission.marks}
                            onChange={(e) =>
                              setGrading({
                                ...grading,
                                [`${submission.id}-${submission.assignmentID}`]: {
                                  ...grading[`${submission.id}-${submission.assignmentID}`],
                                  marks: e.target.value,
                                },
                              })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Feedback"
                            value={grading[`${submission.id}-${submission.assignmentID}`]?.feedback ?? submission.feedback}
                            onChange={(e) =>
                              setGrading({
                                ...grading,
                                [`${submission.id}-${submission.assignmentID}`]: {
                                  ...grading[`${submission.id}-${submission.assignmentID}`],
                                  feedback: e.target.value,
                                },
                              })
                            }
                          />
                        </td>
                        <td>
                          <button onClick={() => gradeAssignment(submission.assignmentID, submission.id)}>
                            ✅ Submit Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No student submissions yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GradeAssignment;
