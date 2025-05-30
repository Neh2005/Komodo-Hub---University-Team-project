
/* ***************************** Neha's part*****************************/

import React, { useState, useEffect } from "react";
import { collection, doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { useNavigate } from "react-router-dom";
import "./AssignmentStudent.css"; // Ensure correct styles

const StudentAssignment = () => {
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const navigate = useNavigate();

  console.log("✅ `StudentAssignment.js` component is rendering...");

  useEffect(() => {
    console.log("✅ Checking Firebase Auth...");

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.error("❌ No user logged in! Redirecting...");
        navigate("/login");
        return;
      }

      console.log("✅ User logged in:", user.uid);

      const studentRef = doc(db, `users/student/members/${user.uid}`);
      const assignmentsRef = collection(db, "assignments");

      console.log("✅ Fetching student data...");

      const unsubscribeStudent = onSnapshot(studentRef, (studentSnap) => {
        if (studentSnap.exists()) {
          const studentData = studentSnap.data();
          console.log("✅ Student Data:", studentData);
          setStudent(studentData);

          const unsubscribeAssignments = onSnapshot(assignmentsRef, (snap) => {
            const classAssignments = snap.docs
              .filter((doc) => doc.data().classID === studentData.classID)
              .map((doc) => {
                const data = doc.data();
                return {
                  id: doc.id,
                  ...data,
                  due_date: data.due_date?.toDate().toLocaleString() || "No due date",
                  userSubmissions: data.submissionDetails?.filter(sub => sub.studentID === user.uid) || []
                };
              });

            console.log("✅ Assignments Fetched:", classAssignments);
            setAssignments(classAssignments);
            setIsLoading(false);
          });

          return unsubscribeAssignments;
        } else {
          console.error("❌ No student data found!");
          setIsLoading(false);
        }
      });

      return () => {
        unsubscribeStudent();
      };
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const openPopup = (assignment) => {
    setSelectedAssignment(assignment);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
    setSelectedAssignment(null);
    setSelectedFile(null);
  };

  const uploadStudentSubmission = async () => {
    if (!selectedFile || !selectedAssignment) {
      alert("Please select a file before uploading.");
      return;
    }

    if (selectedAssignment.userSubmissions.length >= 3) {
      alert("You have reached the maximum submission limit (3 times).");
      return;
    }

    setUploading(true);

    try {
      const fileData = await convertFileToBase64(selectedFile);
      const assignmentRef = doc(db, `assignments/${selectedAssignment.id}`);

      const submissionData = {
        studentID: auth.currentUser.uid,
        studentName: student?.name || "Unknown",
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData,
        uploadedAt: new Date(),
      };

      await updateDoc(assignmentRef, {
        submissionDetails: arrayUnion(submissionData),
      });

      alert("Assignment submitted successfully!");
      closePopup();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      alert("Failed to submit assignment.");
    }

    setUploading(false);
  };

  const deleteSubmission = async (submission) => {
    if (submission.studentID !== auth.currentUser.uid) {
      alert("You can only delete your own submissions.");
      return;
    }

    try {
      const assignmentRef = doc(db, `assignments/${selectedAssignment.id}`);
      await updateDoc(assignmentRef, {
        submissionDetails: arrayRemove(submission),
      });

      alert("Submission deleted successfully!");
      closePopup();
    } catch (error) {
      console.error("Error deleting submission:", error);
      alert("Failed to delete submission.");
    }
  };

  return (
    <div className="student-assignment-page student-dashboard-container">
      {isLoading ? (
        <p>Loading assignments...</p>
      ) : (
        <>
          {/* Sidebar */}
          <div className="student-sidebar">
            <ul className="student-nav-links">
              <li className="student-profile">
                <img src={student?.avatar || "images/user.png"} alt="Student Profile" />
                <span>{student?.name || "Student Name"}</span>
              </li>
              <li><a href="#"><i className="fas fa-book"></i> Courses</a></li>
              <li><a href="#"><i className="fas fa-file-alt"></i> Assignments</a></li>
              <li><a href="/timetable"><i className="fas fa-calendar"></i> Schedule</a></li>
            </ul>
            <div className="assignment-bottom-buttons">
          <button
            className="assignment-back-dashboard-btn"
            onClick={() => navigate("/studentdashboard")}
          >
            🔙 Back to Dashboard
          </button>
        </div>
          </div>

          {/* Main Content */}
          <div className="student-content-wrapper">
            <div className="student-main-content">
              <h2>📂 Assigned Tasks</h2>

              {assignments.length > 0 ? (
                <ul className="student-assignments-list">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="assignment-card" onClick={() => openPopup(assignment)}>
                      <strong>{assignment.title}</strong>
                      <p>Due Date: {assignment.due_date}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No assignments available.</p>
              )}
            </div>
          </div>

          {/* Assignment Popup */}
          {popupOpen && selectedAssignment && (
            <>
              <div className="assignment-overlay" onClick={closePopup}></div>
              <div className="assignment-popup">
                <h2>{selectedAssignment.title}</h2>
                <p>Due Date: {selectedAssignment.due_date}</p>
                <p>Remaining Uploads: {3 - selectedAssignment.userSubmissions.length}</p>

                <h3>Your Submissions:</h3>
                <ul>
                  {selectedAssignment.userSubmissions.map((submission, index) => (
                    <li key={index}>
                      <a href={submission.fileData} download={submission.fileName} target="_blank" rel="noopener noreferrer">
                        📎 {submission.fileName}
                      </a>
                      <span> | Marks: {submission.marks || "Not graded yet"}</span>
                      <span> | Feedback: {submission.feedback || "No feedback"}</span>
                      <button className="assignment-delete-btn" onClick={() => deleteSubmission(submission)}>Delete</button>
                    </li>
                  ))}
                </ul>

                <input type="file" accept=".docx,.pdf" onChange={handleFileChange} />
                <div className="buttons">
                  <button className="assignment-confirm-btn" onClick={uploadStudentSubmission} disabled={uploading || selectedAssignment.userSubmissions.length >= 3}>
                    {uploading ? "Uploading..." : "Submit"}
                  </button>
                  <button className="assignment-cancel-btn" onClick={closePopup}>Close</button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StudentAssignment;
