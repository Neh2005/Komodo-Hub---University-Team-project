// **** CHALITHA's PART ****

import React, { useState, useEffect } from "react";
import {  collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, onSnapshot, getDoc, Timestamp,} from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { useNavigate } from "react-router-dom";
import "./TeacherAssignment.css"; // ✅ Ensure styling matches the given CSS

const TeacherAssignmentCreate = () => {
  const [assignments, setAssignments] = useState([]);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [teacher, setTeacher] = useState(null);
  const navigate = useNavigate();

  // ✅ Fetch teacher details
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (auth.currentUser) {
        const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);

        try {
          const docSnap = await getDoc(teacherRef);
          if (docSnap.exists()) {
            setTeacher(docSnap.data());
          } else {
            console.error("Teacher data not found.");
          }
        } catch (error) {
          console.error("Error fetching teacher data:", error);
        }
      }
    };

    fetchTeacherData();
  }, []);

  // ✅ Fetch assignments created by the teacher
  useEffect(() => {
    if (auth.currentUser) {
      const assignmentsQuery = query(
        collection(db, "assignments"),
        where("teacherID", "==", auth.currentUser.uid) // ✅ Fetch only teacher's assignments
      );

      const unsubscribe = onSnapshot(assignmentsQuery, (snapshot) => {
        const assignmentList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAssignments(assignmentList);
      });

      return () => unsubscribe();
    }
  }, []);

  // ✅ Convert File to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // ✅ Handle File Selection
  const handleFileChangeCreate = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // ✅ Store assignment in Firestore
  const createAssignmentCreate = async () => {
    if (!assignmentTitle.trim() || !selectedFile) {
      alert("Please enter an assignment title and select a file.");
      return;
    }

    if (!teacher || !teacher.classID) {
      alert("Error: Teacher data not loaded. Please try again.");
      return;
    }

    setUploading(true);
    try {
      const fileData = await convertFileToBase64(selectedFile); // Convert to Base64

      // ✅ Store assignment in Firestore with Base64 file data
      await addDoc(collection(db, "assignments"), {
        title: assignmentTitle,
        teacherID: auth.currentUser.uid,
        classID: teacher.classID, // ✅ Assign to the teacher's class
        due_date: Timestamp.fromDate(new Date("2025-03-01")),
        fileData, // ✅ Store file as Base64 string
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        submittedBy: [],
      });

      alert("Assignment created successfully!");
      setAssignmentTitle("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Failed to create assignment.");
    }
    setUploading(false);
  };

  // ✅ Delete Assignment (Only if teacher owns it)
  const deleteAssignmentCreate = async (assignmentID, teacherID) => {
    if (teacherID !== auth.currentUser.uid) {
      alert("You can only delete your own assignments.");
      return;
    }

    try {
      await deleteDoc(doc(db, "assignments", assignmentID));
      alert("Assignment deleted successfully!");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("Failed to delete assignment.");
    }
  };

  return (
    <div className="teacher-dashboard-container-create">
      {/* Sidebar */}
      <div className="teacher-sidebar-create">
        <ul className="teacher-nav-links-create">
          <li className="teacher-profile-create">
            <img
              src={teacher?.avatar || "images/user.png"}
              alt="Teacher Profile"
            />
            <span>{teacher?.name || "Teacher Name"}</span>
          </li>
          <li>
            <a href="#">
              <i className="fas fa-chalkboard-teacher"></i> Students
            </a>
          </li>
          <li>
            <a href="/grading">
              <i className="fas fa-file-alt"></i> Grade Assignments
            </a>
          </li>
          <li>
            <a href="#">
              <i className="fas fa-calendar"></i> Announcements
            </a>
          </li>
          <li>
            <a href="/messages">
              <i className="fas fa-comments"></i> Messages
            </a>
          </li>
        </ul>
        <div className="grading-bottom-buttons">
              <button className="grading-back-dashboard-btn" onClick={() => navigate("/teacher-dashboard")}>
                🔙 Back to Dashboard
              </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="teacher-content-wrapper-create">
        <div className="teacher-main-content-create">
          <h2>📌 Create Assignments</h2>

          <input
            type="text"
            placeholder="Enter assignment title"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
          />
          <input type="file" onChange={handleFileChangeCreate} />
          <button onClick={createAssignmentCreate} disabled={uploading}>
            {uploading ? "Uploading..." : "➕ Create Assignment"}
          </button>

          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card-create">
                <h3>{assignment.title}</h3>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {new Date(assignment.due_date.seconds * 1000).toLocaleDateString()}
                </p>
                <p>
                  <strong>Assignment File:</strong>{" "}
                  <a href={assignment.fileData} download={assignment.fileName}>
                    📄 Download File
                  </a>
                </p>

                {/* ✅ Delete Button (Only for the teacher who created it) */}
                {assignment.teacherID === auth.currentUser.uid && (
                  <button
                    className="delete-button-create"
                    onClick={() => deleteAssignmentCreate(assignment.id, assignment.teacherID)}
                  >
                    ❌ Delete Assignment
                  </button>
                )}
              </div>
            ))
          ) : (
            <p>No assignments created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAssignmentCreate;
