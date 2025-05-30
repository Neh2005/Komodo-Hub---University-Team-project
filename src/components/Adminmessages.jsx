
// ***************************Neha's part***************************

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where, doc, getDoc, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation } from "react-router-dom";
import "./Messages.css";
import Header from "./Header";

const AdminMessages = () => {
  const [classMembers, setClassMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userClassID, setUserClassID] = useState(localStorage.getItem("userClassID") || "");
  const location = useLocation(); 

  // ✅ Fetch user class ID & role when authenticatedy
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserRoleAndClassID();
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Fetch data on location or member change
  useEffect(() => {
    if (userRole) fetchClassMembers();
   
  }, [location, selectedMember, userRole]);

  // 🔹 Fetch User Role & Class ID
  const fetchUserRoleAndClassID = async () => {
    if (!auth.currentUser) return;

    try {
      let role = null;
      let classID = null;

      // ✅ Check if the user is an Admin
      const adminRef = doc(db, `users/admin/members/${auth.currentUser.uid}`);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists()) {
        role = "Admin";
      } else {
        // ✅ Check if the user is a Teacher
        const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          role = "Teacher";
          classID = teacherSnap.data().classID;
        } else {
          // ✅ Check if the user is a Student
          const studentRef = doc(db, `users/student/members/${auth.currentUser.uid}`);
          const studentSnap = await getDoc(studentRef);
          if (studentSnap.exists()) {
            role = "Student";
            classID = studentSnap.data().classID;
          }
        }
      }

      if (classID) localStorage.setItem("userClassID", classID);
      setUserRole(role);
      setUserClassID(classID);
    } catch (error) {
      console.error("Error fetching user role & classID:", error);
    }
  };

  // 🔹 Fetch Class Members or All Users (if Admin)
  const fetchClassMembers = async () => {
    if (!auth.currentUser || !userRole) return;

    try {
      let users = [];

      if (userRole === "Admin") {
        console.log("🔹 Admin logged in - Fetching all users...");
        
        const teacherSnapshot = await getDocs(collection(db, "users/teacher/members"));
        const studentSnapshot = await getDocs(collection(db, "users/student/members"));
        const communitySnapshot = await getDocs(collection(db, "users/community/members"));
        const enthusiastSnapshot = await getDocs(collection(db, "users/general_enthusiast/members"));

        users = [
          ...teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "Teacher" })),
          ...studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "Student" })),
          ...communitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "Community Member" })),
          ...enthusiastSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "General Enthusiast" }))
        ];
      } else {
        console.log("🔹 Fetching class members for non-admin users...");

        if (!userClassID) {
          console.warn("⚠ No class ID found.");
          return;
        }

        const teacherQuery = query(collection(db, "users/teacher/members"), where("classID", "==", userClassID));
        const studentQuery = query(collection(db, "users/student/members"), where("classID", "==", userClassID));

        const teacherSnapshot = await getDocs(teacherQuery);
        const studentSnapshot = await getDocs(studentQuery);

        users = [
          ...teacherSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "Teacher" })),
          ...studentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), role: "Student" }))
        ];
      }

      setClassMembers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // 🔹 Fetch chat messages in real-time
  useEffect(() => {
    if (selectedMember) {
      fetchMessages();
    }
  }, [selectedMember]);

  const fetchMessages = () => {
    if (!auth.currentUser || !selectedMember) return;
  
    const chatId =
      auth.currentUser.uid < selectedMember.id
        ? `${auth.currentUser.uid}_${selectedMember.id}`
        : `${selectedMember.id}_${auth.currentUser.uid}`;
  
    const messagesRef = collection(db, "messages");
    const messagesQuery = query(messagesRef, where("chatId", "==", chatId), orderBy("timestamp", "asc"));
  
    // ✅ Properly unsubscribe when component unmounts or member changes
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  
    return () => unsubscribe(); // ✅ Cleanup function
  };
  
  // 🔹 Call this inside useEffect
  useEffect(() => {
    if (selectedMember) {
      return fetchMessages(); // ✅ Auto-unsubscribes old listener when switching members
    }
  }, [selectedMember]);
  
  // 🔹 Send a new message
  const sendMessage = async () => {
    if (!selectedMember || !message.trim()) {
      alert("Please select a member and enter a message.");
      return;
    }

    setIsSending(true);
    try {
      const chatId =
        auth.currentUser.uid < selectedMember.id
          ? `${auth.currentUser.uid}_${selectedMember.id}`
          : `${selectedMember.id}_${auth.currentUser.uid}`;

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser.uid,
        receiverId: selectedMember.id,
        content: message,
        timestamp: new Date(),
        chatId,
        isRead: false,
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };

  return (
    <div className="messages-page">
      <Header />
    <div className="messages-container">
      <div className="messages-sidebar">
        <h3>👥 Members</h3>
        <ul>
          {classMembers.length > 0 ? (
            classMembers.map((member) => (
              <li key={member.id} className={`member-item ${selectedMember?.id === member.id ? "selected" : ""}`} onClick={() => setSelectedMember(member)}>
                <img src={member.avatar || "default-avatar.png"} alt="Member Avatar" />
                <span>{member.name} ({member.role})</span>
              </li>
            ))
          ) : (
            <p>No members found.</p>
          )}
        </ul>
      </div>

      <div className="message-box">
        {selectedMember ? (
          <>
            <h3>📩 Chat with {selectedMember.name} ({selectedMember.role})</h3>

            {/* ✅ Ensure messages are displayed properly */}
      <div className="chat-box">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.senderId === auth.currentUser.uid ? "sent" : "received"}`}>
              <p><strong>{msg.senderId === auth.currentUser.uid ? "You" : selectedMember.name}:</strong> {msg.content}</p>
            </div>
          ))
        ) : (
          <p>No messages yet.</p>
        )}
      </div>
      
            <textarea className="message-input" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <button onClick={sendMessage} className="send-message-btn" disabled={isSending}>{isSending ? "Sending..." : "Send Message"}</button>
          </>
        ) : (
          <p>Select a member to start messaging.</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminMessages;
