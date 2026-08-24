
// **** CHALITHA's PART ****

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc, getDocs, collection, query, where, limit, onSnapshot, addDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseconfig";
import { getGravatarUrl } from "../utils/avatar";
import Calendar from "react-calendar";
import "./TeacherDashboard.css";
import "react-calendar/dist/Calendar.css"; 

const TeacherDashboard = () => {
  const [teacher, setTeacher] = useState(null);
  const navigate = useNavigate();
  const [assignedAssignments, setAssignedAssignments] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);
  const [teacherTheme, setTeacherTheme] = useState("blue");
  const [showTeacherProfilePopup, setShowTeacherProfilePopup] = useState(false);
  const [showTeacherDeletePopup, setShowTeacherDeletePopup] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [schoolSubscription, setSchoolSubscription] = useState(null);
  const [timetable, setTimetable] = useState({ classID: "", subject: "", time: "" });
  const [showTimetablePopup, setShowTimetablePopup] = useState(false);


  const handleAddTimetable = async () => {
    try {
      await addDoc(collection(db, "timetable"), timetable);
      alert("Timetable added successfully!");
      setShowTimetablePopup(false);
    } catch (error) {
      console.error("Error adding timetable:", error);
    }
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        // Bounded instead of an unfiltered full-collection scan — see StudentDashboard.jsx
        // for the same fix and why it matters under concurrent load.
        const programsQuery = query(collection(db, "programs"), limit(50));
        const programsSnapshot = await getDocs(programsQuery);
        const programsData = programsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPrograms(programsData);
      } catch (error) {
        console.error("Error fetching programs: ", error);
      }
    };

    fetchPrograms();
  }, []);
  
   

  useEffect(() => {
    // auth.currentUser can be transiently null right after mount — Firebase restores the
    // session asynchronously, so a plain synchronous check here can run before it's ready
    // and leave `teacher` stuck at null. onAuthStateChanged reliably waits for the real state.
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) fetchTeacherData(firebaseUser.uid);
    });

    const fetchTeacherData = async (uid) => {
      const teacherRef = doc(db, `users/teacher/members/${uid}`);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        const teacherData = teacherSnap.data();
        setTeacher(teacherData);
        setTeacherTheme(teacherData.theme || "blue");
        setAssignedAssignments(teacherData.assignedAssignments || 0);
        setPendingEvaluations(teacherData.pendingEvaluations || 0);

        if (teacherData.schoolCode) {
          const subscriptionData = await fetchSchoolSubscriptionDetails(teacherData.schoolCode, teacherRef, teacherData.subscriptionDetails);
          if (subscriptionData) {
            setSchoolSubscription(subscriptionData); // ✅ Store in state for display
          }
        }
      }
    };

    return () => unsubscribeAuth();
  }, []);
  

  const fetchSchoolSubscriptionDetails = async (teacherSchoolCode, teacherRef, currentSubscriptionDetails) => {
    try {

      const schoolCollection = collection(db, "users/school/members");
      const schoolQuery = query(schoolCollection, where("schoolCode", "==", teacherSchoolCode));
      const schoolSnapshot = await getDocs(schoolQuery);


      if (!schoolSnapshot.empty) {
        const schoolData = schoolSnapshot.docs[0].data();

        if (schoolData.subscriptionActive !== undefined && schoolData.subscriptionExpiry !== undefined) {
          const subscriptionDetails = {
            subscriptionActive: schoolData.subscriptionActive,
            subscriptionExpiry: schoolData.subscriptionExpiry,
          };

          // Only write back if something actually changed — this fired an extra write on
          // every single dashboard load before, regardless of whether the subscription
          // data was identical to what was already stored.
          const unchanged =
            currentSubscriptionDetails?.subscriptionActive === subscriptionDetails.subscriptionActive &&
            currentSubscriptionDetails?.subscriptionExpiry?.toMillis?.() === subscriptionDetails.subscriptionExpiry?.toMillis?.();

          if (!unchanged) {
            await updateDoc(teacherRef, { subscriptionDetails });
          }

          return subscriptionDetails; // Return the data to update the dashboard
        } else {
          console.warn("⚠️ Subscription details not found in school document.");
        }
      } else {
        console.warn("🚨 No matching school found for the teacher's schoolCode.");
      }
    } catch (error) {
      console.error("⚠️ Error fetching subscription details:", error);
    }
    return null; // Return null if no subscription details were found
  };
  


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsQuery = query(collection(db, "events"), limit(50));
        const eventsSnapshot = await getDocs(eventsQuery);
        const eventsData = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUpcomingEvents(eventsData);
      } catch (error) {
        console.error("Error fetching events: ", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", teacherTheme);
  }, [teacherTheme]);

  const updateTeacherProfile = async () => {
    if (auth.currentUser) {
      const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);
      const updatedTeacher = { ...teacher, theme: teacherTheme };
      await updateDoc(teacherRef, updatedTeacher);
      setTeacher(updatedTeacher);
      setShowTeacherProfilePopup(false);
    }
  };

  const handleTeacherDeleteAccount = async () => {
    if (auth.currentUser) {
      const teacherRef = doc(db, `users/teacher/members/${auth.currentUser.uid}`);
      await deleteDoc(teacherRef);
      auth.signOut();
      alert("Your account has been deleted successfully.");
      setShowTeacherDeletePopup(false);
    }
  };

  // ✅ Fetch notifications in real-time
  useEffect(() => {
    if (auth.currentUser) {
        const notificationsRef = collection(db, "notifications");
        const notificationsQuery = query(
            notificationsRef,
            where("userId", "==", auth.currentUser.uid),
            where("isRead", "==", false) // Fetch only unread notifications
        );

        // 🔹 Real-time listener for unread notifications
        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const notificationsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setNotifications(notificationsData);
            
            // ✅ Show red dot only if there are unread notifications
            setHasUnreadMessages(notificationsData.length > 0);
        });

        return () => unsubscribe();
    }
}, []);

/*Avatars*/
const avatarUrl = teacher?.avatar || getGravatarUrl(teacher?.email) || "images/user.png";


const goToMessages = async () => {
  try {
      // 🔹 Mark all unread notifications as read
      const batch = notifications.map(async (notif) => {
          const notificationDoc = doc(db, "notifications", notif.id);
          return updateDoc(notificationDoc, { isRead: true });
      });

      await Promise.all(batch); // Wait for all updates to complete

      setHasUnreadMessages(false); // ✅ Remove red dot after marking as read
      navigate("/messages"); // ✅ Redirect to messages page
  } catch (error) {
      console.error("Error marking notifications as read:", error);
  }
};

const handleLogout = async (e) => {
  e.preventDefault();
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
  }
  navigate("/login");
};

  return (
    <div className="teacher-dashboard-container">
      {/* Sidebar */}
      <div className="teacher-sidebar">
        <ul className="teacher-nav-links">
          <li className="teacher-profile">
            <img
              src={avatarUrl} alt="Teacher Profile" onClick={() => setShowTeacherProfilePopup(true)}
            />
            <span>{teacher?.name || "Teacher Name"}</span>
          </li>
          <li><Link to="/studentinformation"><i className="fas fa-chalkboard-teacher"></i> Students</Link></li>
          <li><Link to="/grading"><i className="fas fa-file-alt"></i> Grade Assignments</Link></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); setShowTimetablePopup(true); }}><i className="fas fa-calendar-plus"></i> Add Class Schedule</a></li>
          <li>
            <Link to="/messages" onClick={(e) => { e.preventDefault(); goToMessages(); }}>
              <i className="fas fa-bell"></i> Notifications
              {hasUnreadMessages && <span className="notification-dot"></span>} {/* 🔴 Red dot if unread messages exist */}
            </Link>
          </li>
          <li><Link to="/messages"><i className="fas fa-comments"></i> Messages</Link></li>
        </ul>
        <div className="teacher-bottom-buttons">
          <button className="teacher-delete-btn" onClick={() => setShowTeacherDeletePopup(true)}>🗑️ Delete Account</button>
          <a href="/login" className="teacher-logout-btn" onClick={handleLogout}>Logout</a>
        </div>
      </div>

      {/* Main Content */}
      <div className="teacher-content-wrapper">
        <div className="teacher-main-content">
          <h2>Welcome, {teacher?.name || "Teacher"}!</h2>
          

          {/* Quick Actions */}
          <div className="teacher-quick-actions">
            <button className="quick-action-btn" onClick={() => navigate("/teacherassignment")}>📄 Upload Assignments</button>
            <button className="quick-action-btn" onClick={() => navigate("/grading")}>📊 View Reports</button>
            <button className="quick-action-btn" onClick={() => navigate("/messages")}>📩 Send Message</button>
          </div>

          
          {/* Stats */}
          <div className="teacher-dashboard-content">
            <div className="teacher-stat-card">
              <h3>Assigned Assignments</h3>
              <p>{assignedAssignments}</p>
            </div>
            <div className="teacher-stat-card">
              <h3>Pending Evaluations</h3>
              <p>{pendingEvaluations}</p>
            </div>
          </div>

          {showTimetablePopup && (
        <div className="teacher-popup-overlay">
          <div className="teacher-popup-box">
            <h2>Add Class to Schedule</h2>
            <label>Class ID:</label>
            <input type="text" value={timetable.classID} onChange={(e) => setTimetable({ ...timetable, classID: e.target.value })} />
            <label>Subject:</label>
            <input type="text" value={timetable.subject} onChange={(e) => setTimetable({ ...timetable, subject: e.target.value })} />
            <label>Time:</label>
            <input type="text" value={timetable.time} onChange={(e) => setTimetable({ ...timetable, time: e.target.value })} />
            <label>Day:</label>
            <input type="text" value={timetable.day} onChange={(e) => setTimetable({ ...timetable, day: e.target.value })} />
            <button onClick={handleAddTimetable}>Add Schedule</button>
            <button onClick={() => setShowTimetablePopup(false)}>Cancel</button>
          </div>
        </div>
      )}

          <div className="teacher-upcoming-programs">
        <h2>📅 Upcoming Activities</h2>
        <div className="teacher-programs-carousel">
          <button className="teacher-carousel-btn left-btn">◀</button>
          <div className="teacher-programs-container">
            {programs.length > 0 ? (
              programs.map((program) => (
                <div key={program.id} className="teacher-program-card">
                  <img src={program.image || "default-image.jpg"} alt={program.title} />
                  <h2>{program.title}</h2>
                  <h3>{program.description}</h3>
                  <p>{program.date}</p>
                </div>
              ))
            ) : (
              <p>No upcoming programs</p>
            )}
          </div>
          <button className="teacher-carousel-btn right-btn">▶</button>
        </div>
      </div>
    </div>

        {/* Profile Popup */}
        {showTeacherProfilePopup && (
          <div className="teacher-profile-popup-overlay">
            <div className="teacher-profile-popup-box">
              <span className="teacher-close-btn" onClick={() => setShowTeacherProfilePopup(false)}>×</span>
              <h2>Edit Profile</h2>
              <img src={avatarUrl} alt="Teacher Avatar" className="teacher-profile-avatar" />
              <label>Name:</label>
              <input type="text" value={teacher?.name || ""} onChange={(e) => setTeacher({ ...teacher, name: e.target.value })} />
              <label>Teacher ID</label>
              <input type="text" value={teacher?.TeacherId || ""} onChange={(e) => setTeacher({ ...teacher, TeacherId: e.target.value })} />
              <label>Access Code</label>
              <input type="password" value={teacher?.classID || ""} onChange={(e) => setTeacher({ ...teacher, classID: e.target.value })} />

              {/* Subscription Details */}
              <h3>School Subscription Details</h3>
                {schoolSubscription ? (
                  <p>Plan: {schoolSubscription.active ? "Active" : "Inactive"}, Expiry: {schoolSubscription.expiry}</p>
                  ) : (
                  <p>Loading...</p>
                  )}

              <button className="teacher-save-btn" onClick={updateTeacherProfile}>Save Changes</button>
            </div>
          </div>
        )}

        {/* Delete Popup */}
        {showTeacherDeletePopup && (
          <div className="teacher-delete-popup-overlay">
            <div className="teacher-delete-popup-box">
              <h2>Confirm Account Deletion</h2>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="teacher-delete-popup-buttons">
                <button className="confirm-delete" onClick={handleTeacherDeleteAccount}>Delete</button>
                <button className="cancel-btn" onClick={() => setShowTeacherDeletePopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        

                {/* Right Sidebar - Calendar & Upcoming Events */}
                <div className="teacher-right-sidebar">
                {/* Calendar Section */}
                <div className="teacher-calendar">
                <Calendar
                  onChange={setCalendarDate}
      value={calendarDate}
      className="react-calendar"
    />
  </div>

  {/* Upcoming Events Section */}
  <div className="teacher-upcoming-events">
    <h3>📅 Upcoming Events</h3>
    <ul>
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event, index) => {
          // Assign colors based on index
          const colors = ["event-red", "event-orange", "event-yellow", "event-green"];
          const eventColor = colors[index % colors.length];

          return (
            <li key={event.id} className="teacher-event-item">
              <div className={`teacher-event-icon ${eventColor}`}></div>
              <div className="teacher-event-content">
                <span className="teacher-event-title">{event.name}</span>
                <span className="teacher-event-time">{event.date} • {event.time}</span>
              </div>
            </li>
          );
        })
      ) : (
        <p>No upcoming events</p>
      )}
    </ul>
  </div>
  
</div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
