
// *********************** Neha's part ************************

import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where, doc, getDoc, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation } from "react-router-dom";
import "./Messages.css";
import Header from "./Header";

const Messages = () => {
  const [classMembers, setClassMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [userClassID, setUserClassID] = useState(localStorage.getItem("userClassID"));
  const location = useLocation(); // ✅ Detects navigation

  // 🔹 Fetch user class ID when authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserClassID();
      }
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Re-fetch when redirected
  useEffect(() => {
    fetchUserClassID();
    markMessagesAsRead(); // ✅ Ensure messages are marked as read
  }, [location, selectedMember]);

  const fetchUserClassID = async () => {
    if (auth.currentUser) {
      try {
        let foundClassID = localStorage.getItem("userClassID");

        if (!foundClassID) {
          const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);
          const teacherSnap = await getDoc(teacherRef);

          if (teacherSnap.exists()) {
            foundClassID = teacherSnap.data().classID;
          } else {
            const studentRef = doc(db, `users/student/members/${auth.currentUser.uid}`);
            const studentSnap = await getDoc(studentRef);

            if (studentSnap.exists()) {
              foundClassID = studentSnap.data().classID;
            }
          }

          if (foundClassID) {
            localStorage.setItem("userClassID", foundClassID);
          }
        }

        if (foundClassID) {
          setUserClassID(foundClassID);
        } else {
          console.error("ClassID not found for user.");
        }
      } catch (error) {
        console.error("Error fetching user classID: ", error);
      }
    }
  };

  // 🔹 Fetch class members in real-time when classID updates
  useEffect(() => {
    if (userClassID) {
      return fetchClassMembers(userClassID);
    }
  }, [userClassID]);

  const fetchClassMembers = (classID) => {
    if (!classID) return;

    const teacherQuery = query(collection(db, "users/teacher/members"), where("classID", "==", classID));
    const studentQuery = query(collection(db, "users/student/members"), where("classID", "==", classID));
    const adminQuery = collection(db, "users/admin/members"); // ✅ Fetch all Admins globally

    const unsubscribeTeachers = onSnapshot(teacherQuery, (snapshot) => {
      const teachers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), role: "Teacher" }));
      setClassMembers((prev) => [...teachers]);
    });

    const unsubscribeStudents = onSnapshot(studentQuery, (snapshot) => {
      const students = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), role: "Student" }));
      setClassMembers((prev) => [...prev, ...students]);
    });

    const unsubscribeAdmins = onSnapshot(adminQuery, (snapshot) => {
      const admins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), role: "Admin" }));
      setClassMembers((prev) => [...prev, ...admins]); // ✅ Add Admins to the sidebar
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeStudents();
      unsubscribeAdmins();
    };
  };

  // 🔹 Fetch chat history between two users in real-time
  useEffect(() => {
    if (selectedMember) {
      fetchMessages();
    }
  }, [selectedMember]);

  const fetchMessages = async () => {
    if (!auth.currentUser || !selectedMember) return;

    try {
      let messagesQuery;

      if (selectedMember.role === "Admin") {
        // ✅ Fetch only messages sent by the Admin to the logged-in user
        messagesQuery = query(
          collection(db, "messages"),
          where("senderId", "==", selectedMember.id),
          where("receiverId", "==", auth.currentUser.uid), // Ensure it's sent **to** the current user
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            senderRole: "Admin",
            ...doc.data(),
          }));

          setMessages(messagesData);

          // ✅ Mark messages as read after fetching them
          markMessagesAsRead(messagesData);
        });

        return () => unsubscribe();
      } else {
        // ✅ Keep the existing student-teacher chat functionality
        const chatId =
          auth.currentUser.uid < selectedMember.id
            ? `${auth.currentUser.uid}_${selectedMember.id}`
            : `${selectedMember.id}_${auth.currentUser.uid}`;

        messagesQuery = query(
          collection(db, "messages"),
          where("chatId", "==", chatId),
          orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setMessages(messagesData);
          setTimeout(() => markMessagesAsRead(messagesData), 500);
        });

        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  
  const sendMessage = async () => {
    if (!selectedMember || !message.trim()) {
      alert("Please select a member and enter a message.");
      return;
    }

    setIsSending(true);
    try {
      let senderRole = "Unknown";

      const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        senderRole = "Teacher";
      } else {
        const studentRef = doc(db, `users/student/members/${auth.currentUser.uid}`);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          senderRole = "Student";
        }
      }

      const receiverRole = selectedMember.role;

      const chatId =
        auth.currentUser.uid < selectedMember.id
          ? `${auth.currentUser.uid}_${selectedMember.id}`
          : `${selectedMember.id}_${auth.currentUser.uid}`;

      const messagesRef = collection(db, "messages");
      await addDoc(messagesRef, {
        senderId: auth.currentUser.uid,
        receiverId: selectedMember.id,
        senderRole: senderRole,
        receiverRole: receiverRole,
        content: message,
        timestamp: new Date(),
        chatId: chatId,
        isRead: false,
      });

      // ✅ Store notification for the receiver
      const notificationsRef = collection(db, "notifications");
      await addDoc(notificationsRef, {
        userId: selectedMember.id,
        message: `New message from ${auth.currentUser.displayName || "User"}`,
        timestamp: new Date(),
        isRead: false,
      });

      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };

  
  const markMessagesAsRead = async (messagesData) => {
    if (!auth.currentUser) return;

    try {
      const unreadMessages = messagesData.filter((msg) => !msg.isRead);

      await Promise.all(
        unreadMessages.map(async (msg) => {
          const messageRef = doc(db, "messages", msg.id);
          await updateDoc(messageRef, { isRead: true });
        })
      );

      console.log("✅ All unread messages marked as read.");
    } catch (error) {
      console.error("❌ Error marking messages as read:", error);
    }
  };
  
  
  return (
    <div className="messages-page">
      <Header />
      <div className="messages-container">
      
      <div className="messages-sidebar">
        
        <h3>👥 Class Members</h3>
        <ul>
          {classMembers.length > 0 ? (
            classMembers.map((member) => (
              <li
                key={member.id}
                className={`member-item ${selectedMember?.id === member.id ? "selected" : ""}`}
                onClick={() => setSelectedMember(member)}
              >
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

            <div className="chat-box">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.senderId === auth.currentUser.uid ? "sent" : "received"}`}>
                    <p>
                      <strong>{msg.senderRole}: </strong>{msg.content}
                    </p>
                  </div>
                ))
              ) : (
                <p>No messages yet.</p>
              )}
            </div>
          {/* ✅ If selected member is Admin and user is Student, disable messaging */}
{selectedMember?.role === "Admin" && userClassID ? (
  <p className="admin-warning">🚫 You cannot message Admins.</p>
) : (
  <>
    <textarea
      className="message-input"
      placeholder="Type a message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      disabled={selectedMember?.role === "Admin"} // ✅ Disable input for Admin chat
    />
    <button
      onClick={sendMessage}
      className="send-message-btn"
      disabled={isSending || selectedMember?.role === "Admin"} // ✅ Disable send button for Admin chat
    >
      {isSending ? "Sending..." : "Send Message"}
    </button>
  </>
)}

        </>
        ) : (
          <p>Select a member to start messaging.</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default Messages;
