
/* ****** Maneesh's part ******* */

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { useNavigate } from "react-router-dom";
import "./GradeAssignment.css"; // ✅ Ensure styling matches the given CSS

const GradeAssignment = () => {
  const [teacher, setTeacher] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  console.log("✅ `GradeAssignment.js` component is rendering...");

  useEffect(() => {
    console.log("✅ Checking Firebase Auth...");

    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.error("❌ No user logged in! Redirecting...");
        navigate("/login");
        return;
      }

      console.log("✅ User logged in:", user.uid);

      const teacherRef = doc(db, `users/teacher/members/${user.uid}`);

      console.log("✅ Fetching teacher data...");

      try {
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          console.log("✅ Teacher Data:", teacherData);
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
  }, []);

  const fetchSubmissions = async (classID) => {
    if (!classID) return;

    console.log(`✅ Fetching submissions for Class ID: ${classID}`);

    try {
      const assignmentsQuery = query(collection(db, "assignments"), where("classID", "==", classID));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      let allSubmissions = [];

      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignmentID = assignmentDoc.id;
        const assignmentData = assignmentDoc.data();

        if (assignmentData.submissionDetails) {
          for (const submission of assignmentData.submissionDetails) {
            const studentRef = doc(db, `users/student/members/${submission.studentID}`);
            const studentSnap = await getDoc(studentRef);
            const studentName = studentSnap.exists() ? studentSnap.data().name : "Unknown Student";

            allSubmissions.push({
              id: submission.studentID,
              studentName,
              assignmentTitle: assignmentData.title,
              submittedFile: submission.fileData,
              fileName: submission.fileName,
              marks: submission.marks || "",
              feedback: submission.feedback || "",
              assignmentID,
            });
          }
        }
      }

      console.log("✅ Student Submissions Fetched:", allSubmissions);
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

        const updatedSubmissions = assignmentData.submissionDetails.map((submission) => {
          if (submission.studentID === studentID) {
            return {
              ...submission,
              marks: grading[`${studentID}-${assignmentID}`]?.marks || "",
              feedback: grading[`${studentID}-${assignmentID}`]?.feedback || "",
            };
          }
          return submission;
        });

        await updateDoc(assignmentRef, { submissionDetails: updatedSubmissions });

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
                <img src={teacher?.avatar || "images/user.png"} alt="Teacher Profile" />
                <span>{teacher?.name || "Teacher"}</span>
              </li>
              <li><a href="#"><i className="fas fa-chalkboard-teacher"></i> Students</a></li>
              <li><a href="/gradeassignment"><i className="fas fa-file-alt"></i> Grade Assignments</a></li>
              <li><a href="#"><i className="fas fa-calendar"></i> Announcements</a></li>
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
                            value={grading[`${submission.id}-${submission.assignmentID}`]?.marks || submission.marks}
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
                            value={grading[`${submission.id}-${submission.assignmentID}`]?.feedback || submission.feedback}
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
