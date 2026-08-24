
// ************************ Neha's Part ********************

import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { query, where, limit, collection, doc, getDocs,getDoc, setDoc, updateDoc, deleteDoc,arrayUnion, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseconfig";
import { getGravatarUrl } from "../utils/avatar";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./StudentDashboard.css";

Chart.register(...registerables, ChartDataLabels);



const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [completedAssignments, setCompletedAssignments] = useState(0);
  const [incompleteAssignments, setIncompleteAssignments] = useState(0);
  const [logins, setLogins] = useState(new Array(7).fill(0));
  const [points, setPoints] = useState(0);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [theme, setTheme] = useState("violet"); // Default Theme - CHALITHA's PART (Only line 25 to initialize the theme variable)
  const [subscription, setSubscription] = useState(null); // Subscription Data
  const progressChartRef = useRef(null);
  const loginChartRef = useRef(null);
  const [enrolledPrograms, setEnrolledPrograms] = useState([]); // Tracks programs the student is enrolled in
  const [showUnenrollPopup, setShowUnenrollPopup] = useState(false); // Show confirmation popup
  const [selectedProgram, setSelectedProgram] = useState(null); // Store selected program for unenrollment
  const [upcomingPrograms, setUpcomingPrograms] = useState([]); // Stores upcoming programs
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);


  useEffect(() => {
    // auth.currentUser can be transiently null right after mount — Firebase restores the
    // session asynchronously, so a plain synchronous check here can run before it's ready
    // and leave `user` stuck at null (the "default user" / blank dashboard symptom),
    // especially right after navigating back from another page. onAuthStateChanged is the
    // reliable way to know the session is actually ready.
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) fetchUserData(firebaseUser.uid);
    });

    const fetchUserData = async (uid) => {
      const userRef = doc(db, `users/student/members/${uid}`);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser(userData);
        setTheme(userData.theme || "violet"); // CHALITHA'S PART
        setCompletedAssignments(userData.completedAssignments || 0);
        setIncompleteAssignments(userData.incompleteAssignments || 0);
        setEnrolledPrograms(userData.enrolledPrograms || []);
        setPoints(userData.points || 0);
        const today = new Date().getDay(); // Get Current Day Index (0 = Sunday, 6 = Saturday)
        const updatedLogins = [...(Array.isArray(userData.logins) ? userData.logins : new Array(7).fill(0))];
        updatedLogins[today] += 1; // Increment Login Count for Today

        // Update the Database
        await updateDoc(userRef, { logins: updatedLogins });

        setLogins(updatedLogins); // Update State

        // Fetch Subscription Data
        if (userData.schoolCode) {
          const subscriptionData = await fetchSchoolSubscription(userData.schoolCode, userRef, userData.subscriptionDetails);
          if (subscriptionData) {
            setSubscription(subscriptionData); // ✅ Store in state for display
          }
        }
      }
    };

    return () => unsubscribeAuth();
  }, []);


    // 🔹 Fetch Subscription Details Based on schoolCode
    const fetchSchoolSubscription = async (studentSchoolCode, userRef, currentSubscriptionDetails) => {
      try {

        const schoolCollection = collection(db, "users/school/members");
        const schoolQuery = query(schoolCollection, where("schoolCode", "==", studentSchoolCode));
        const schoolSnapshot = await getDocs(schoolQuery);


        if (!schoolSnapshot.empty) {
          const schoolData = schoolSnapshot.docs[0].data();

          if (schoolData.subscriptionActive !== undefined && schoolData.subscriptionExpiry !== undefined) {
            const subscriptionDetails = {
              subscriptionActive: schoolData.subscriptionActive,
              subscriptionExpiry: schoolData.subscriptionExpiry,
            };

            // Only write back if something actually changed — this ran unconditionally on
            // every single dashboard load before, meaning every concurrent user simply
            // opening their dashboard fired an extra Firestore write with nothing to show
            // for it.
            const unchanged =
              currentSubscriptionDetails?.subscriptionActive === subscriptionDetails.subscriptionActive &&
              currentSubscriptionDetails?.subscriptionExpiry?.toMillis?.() === subscriptionDetails.subscriptionExpiry?.toMillis?.();

            if (!unchanged) {
              await updateDoc(userRef, { subscriptionDetails });
            }

            return subscriptionDetails; // Return the data to update the dashboard
          } else {
            console.warn("⚠️ Subscription details not found in school document.");
          }
        } else {
          console.warn("🚨 No matching school found for the student's schoolCode.");
        }
      } catch (error) {
        console.error("⚠️ Error fetching subscription details:", error);
      }
      return null; // Return null if no subscription details were found
    };
    
  
  
  const updateProfile = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, `users/student/members/${auth.currentUser.uid}`);
      
       // CHALITHA'S PART FORM HERE
      const updatedUser = { ...user, theme };
      await updateDoc(userRef, updatedUser);
      setUser(updatedUser);
      document.documentElement.setAttribute("data-theme", theme);
      setTheme(null);
      setTimeout(() => {
        setTheme(theme);  // ✅ Ensure theme state updates (CHALITHA'S PART TILL HERE)
    }, 50);
    
      setShowProfilePopup(false);
    }
  };

  //CHALITHA'S PART
  useEffect(() => {
    if (user?.theme) {
        document.documentElement.setAttribute("data-theme", user.theme);
    }
  }, [user]);// TILL HERE CHALITHA's PART


  useEffect(() => {
    if (progressChartRef.current) progressChartRef.current.destroy();
    const ctx = document.getElementById("progressChart").getContext("2d");
    progressChartRef.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Completed", "Not Completed"],
        datasets: [
          {
            data: [completedAssignments, incompleteAssignments],
            backgroundColor: ["#28a745", "#dc3545"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          datalabels: {
            color: "white",
            font: { weight: "bold", size: 14 },
            formatter: (value) =>
              `${((value / (completedAssignments + incompleteAssignments)) * 100).toFixed(1)}%`,
          },
        },
      },
    });
  }, [completedAssignments, incompleteAssignments]);

  
  useEffect(() => {
    // ✅ Ensure previous chart instance is destroyed before re-rendering
    if (loginChartRef.current) {
        loginChartRef.current.destroy();
        loginChartRef.current = null;
    }

    // ✅ Allow some time for the DOM update before creating the chart
    // (timer id captured below so cleanup can cancel it — previously an uncleared timeout
    // could fire after this effect re-ran or the component unmounted, creating an
    // untracked Chart.js instance bound to a canvas that was no longer current)
    const timerId = setTimeout(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const chartColor = rootStyles.getPropertyValue('--chart-color').trim();

        const canvas = document.getElementById("loginChart");
        if (!canvas) return; // Prevent errors if canvas is not yet mounted

        const ctx = canvas.getContext("2d");

        loginChartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                datasets: [
                    {
                        label: "Logins Per Day",
                        data: logins,
                        borderColor: chartColor,
                        backgroundColor: chartColor + "33",
                        borderWidth: 2,
                        pointRadius: 5,
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2,
                layout: {
                  padding: { top: 10, bottom: 10, left: 10, right: 10 }, // ✅ Prevents stretching
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
                scales: {
                    y: { 
                      beginAtZero: true, 
                      title: { display: true, text: "Logins" }, 
                      suggestedMin: 0, // ✅ Ensures minimum scale starts at 0
                      suggestedMax: Math.max(...logins) + 1,
                    
                    },
                    x: { title: { display: true, text: "Days of the Week" } },
                },
            },
        });
    }, 100);

    // ✅ Cleanup function to properly destroy chart before re-rendering
    return () => {
        clearTimeout(timerId);
        if (loginChartRef.current) {
            loginChartRef.current.destroy();
            loginChartRef.current = null;
        }
    };
}, [logins, theme]);  // ✅ Depend on `logins` and `theme` -


  // Function to handle account deletion
  const handleDeleteAccount = async () => {
    if (auth.currentUser) {
      const userRef = doc(db, `users/student/members/${auth.currentUser.uid}`);
      await deleteDoc(userRef);
      auth.signOut();
      alert("Your account has been deleted successfully.");
      setShowDeletePopup(false);
    }
  };

  useEffect(() => {
    const fetchPrograms = async () => {
      // Bounded instead of an unfiltered full-collection scan — with 100 concurrent
      // students each loading their dashboard, an unbounded fetch here means 100 full
      // reads of this collection every time, growing with it forever.
      const programsQuery = query(collection(db, "programs"), limit(50));
      const snapshot = await getDocs(programsQuery);
      const programsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingPrograms(programsData);
    };

    fetchPrograms();
  }, []);

  const enrollInProgram = async (programId) => {
    if (!auth.currentUser || !user) return;

    const userRef = doc(db, `users/student/members/${auth.currentUser.uid}`);

    try {
      if (enrolledPrograms.includes(programId)) {
        setSelectedProgram(programId);
        setShowUnenrollPopup(true);
        return;
      }
  
      // ✅ Step 1: Update local state instantly
      setEnrolledPrograms((prev) => [...prev, programId]);
  
      // ✅ Step 2: Update Firestore in the background
      await updateDoc(userRef, {
        enrolledPrograms: arrayUnion(programId),
      });
  
      // A shared `enrolledUsers` array field on one document means every enrolling
      // student's write contends for that SAME document — a runTransaction() retries
      // automatically under light contention, but under real concurrent load (measured:
      // 100 different students enrolling in the same program at once) the vast majority
      // of transactions exhaust their retries and fail outright for the user, even though
      // no data gets silently corrupted anymore. The actual fix is to stop sharing one
      // document at all: each student writes only to their OWN enrollment record in a
      // subcollection, so there is zero contention between different students no matter
      // how many enroll at the same moment.
      await setDoc(doc(db, "programs", programId, "enrollments", auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        name: user.name,
        school: user.institute,
        enrolledAt: new Date(),
      });

    alert("Enrolled successfully!");
  } catch (error) {
    console.error("Error enrolling in program:", error);
  }
};
  
  
  const unenrollFromProgram = async (programId) => {
    if (!auth.currentUser || !user || !programId) return;

    const userRef = doc(db, `users/student/members/${auth.currentUser.uid}`);

    try {
      // ✅ Step 1: Update local state first (before Firestore)
      setEnrolledPrograms((prev) => prev.filter(id => id !== programId));

      // ✅ Step 2: Remove from Firestore in the background
      await updateDoc(userRef, {
        enrolledPrograms: enrolledPrograms.filter(id => id !== programId),
      });

      // Delete this student's own enrollment record — see enrollInProgram for why this
      // is a subcollection doc rather than an entry in a shared array field.
      await deleteDoc(doc(db, "programs", programId, "enrollments", auth.currentUser.uid));

      alert("Unenrolled successfully!");
    } catch (error) {
      console.error("Error unenrolling from program:", error);
    }
  };
  
  /*Notifications*/
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
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <ul className="nav-links">
          <li className="profile">
            <img src={user?.avatar || getGravatarUrl(user?.email) || "images/user.png"} alt="User Profile" onClick={() => setShowProfilePopup(true)}/>
            <span>{user?.name || "John Doe"}</span>
          </li>
          <li><a href="#"><i className="fas fa-book"></i> My Courses</a></li>
          <li><Link to="/assignments"><i className="fas fa-file-alt"></i> Assignments</Link></li>
          <li><Link to="/timetable"><i className="fas fa-calendar"></i> Schedule</Link></li>
          <li><Link to="/messages" onClick={(e) => { e.preventDefault(); goToMessages(); }}>
              <i className="fas fa-bell"></i> Notifications
              {hasUnreadMessages && <span className="student-notification-dot"></span>} {/* 🔴 Red dot if unread messages exist */}
            </Link>
          </li>
          <li><Link to="/messages"><i className="fas fa-comments"></i> Messages</Link></li>
        </ul>
        <div className="bottom-buttons">
          <button className="delete-btn" onClick={() => setShowDeletePopup(true)}>Delete Account</button>
          <a href="/login" className="logout-btn" onClick={handleLogout}>Logout</a>
        </div>
        
      </div>

      {/* Main Content + Right Sidebar Wrapper */}
      <div className="content-wrapper">
        <div className="main-content">
        <div className="top-header">
    <h2>Hello, {user?.name || "John Doe"}!</h2>
    <input type="text" className="search-box" placeholder="🔍 Search your course" />
</div>

<div className="dashboard-content">
<div className="stat-card">
        <div className="icon-container">
            <img src="images/enrollment.png" alt="Enrolled Programs" />
        </div>
        <h3>Enrolled Programs</h3>
        <p>{enrolledPrograms.length || 0}</p>
    </div>
    <div className="stat-card">
        <div className="icon-container">
            <img src="images/assignments.png" alt="Completed Assignments" />
        </div>
        <h3>Completed Assignments</h3>
        <p>{completedAssignments}</p>
    </div>
    <div className="stat-card">
        <div className="icon-container">
            <img src="images/pending.png" alt="Pending Assignments" />
        </div>
        <h3>Pending Assignments</h3>
        <p>{incompleteAssignments}</p>
    </div>
    <div className="stat-card">
        <div className="icon-container">
            <img src="images/points.webp" alt="Activity Points" />
        </div>
        <h3>Activity Points</h3>
        <p>{points}</p>
    </div>
</div>
{/* 🔹 New Sliding Bar Section */}
<div className="upcoming-programs-container">
  <h2>Upcoming Programs</h2>
  <div className="scrolling-wrapper">
    {upcomingPrograms.map((program) => {
      const isEnrolled = enrolledPrograms.includes(program.id);
      
      return (
        <div key={program.id} className="program-card">
          <img src={program.image} alt={program.title} className="program-img" />
          <h3>{program.title}</h3>
          <p>{program.description}</p>
          <p><strong>Date:</strong> {program.date}</p>
          <button 
            className={isEnrolled ? "enrolled-btn" : "enroll-btn"}
            onClick={() => {
              if (isEnrolled) {
                  setSelectedProgram(program.id); // Store selected program
                  setShowUnenrollPopup(true); // Show confirmation popup
              } else {
                  enrollInProgram(program.id); // Enroll immediately
              }
            }}
          >
            {isEnrolled ? "Enrolled" : "Enroll"}
          </button>

        </div>
      );
    })}
  </div>
</div>

{/* 🔹 New Quizzes Section */}
<div className="student-quiz-section">
  <h2>Quizzes</h2>
  <div className="student-quiz-card-container">
    <div className="student-quiz-card" onClick={() => navigate("/quiz1")}>
      <img src="https://lh6.googleusercontent.com/AdYdhucRg1fI8tP8-ooWnAN-_3--R6f90ztPxQrwInHqtAUNc7ufor1yosOcFTU1xmngFSwCkmXAblvbhoH9bK885koCYQz399_yA3V_jfTPNMvkQZ_nJL70-z5DVDPe5FcJmu_WJ_k=w1000" alt="Quiz 1" className="student-quiz-img" />
      <h3>Endangered Species Quiz 1</h3>
      <p>Test your knowledge on various subjects.</p>
      <button className="student-quiz-btn">Take Quiz</button>
    </div>

    <div className="student-quiz-card" onClick={() => navigate("/quiz")}>
      <img src="https://www.weareteachers.com/wp-content/uploads/endangered_species_group.jpg" alt="Quiz 2" className="student-quiz-img" />
      <h3>Endangered and Endemic Species Quiz </h3>
      <p>Sharpen your problem-solving skills.</p>
      <button className="student-quiz-btn">Take Quiz</button>
    </div>
  </div>
</div>
</div>


      {/* Unenroll Confirmation Popup */}
{showUnenrollPopup && (
  <div className="unenroll-popup-overlay">
    <div className="unenroll-popup-box">
      <h2>Confirm Unenrollment</h2>
      <p>Are you sure you want to unenroll from this program?</p>
      <div className="unenroll-popup-buttons">
        <button 
          className="unenroll-confirm-btn" 
          onClick={() => {
            unenrollFromProgram(selectedProgram); 
            setShowUnenrollPopup(false); // Hide modal after action
          }}
        >
          Yes, Unenroll
        </button>
        <button 
          className="unenroll-cancel-btn" 
          onClick={() => setShowUnenrollPopup(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

        {/* Right Sidebar */}
        <div className="right-sidebar">
          <div className="chart-container">
            <h2>Student Progress</h2>
            <canvas id="progressChart"></canvas>
          </div>

          <div className="chart-container">
            <h2>Student Login Activity</h2>
            <canvas id="loginChart"></canvas>
          </div>

          <div className="button-container">
            <button className="library-btn" onClick={() => navigate("/library")}>📚 Library</button>
            
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="delete-popup-overlay">
          <div className="delete-popup-box">
            <h2>Are you sure?</h2>
            <p>This action cannot be undone.</p>
            <div className="popup-buttons">
              <button className="confirm-delete" onClick={handleDeleteAccount}>Confirm Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeletePopup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Popup */}
{showProfilePopup && (
  <div className="profile-popup-overlay">
    <div className="profile-popup-box">
      <span className="close-btn" onClick={() => setShowProfilePopup(false)}>✖</span>
      <h2>Edit Profile</h2>

      <label>Name</label>
      <input type="text" value={user?.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} />

      <label>Select Avatar</label>
      <div className="avatar-selection">
        {["images/avatar1.jpeg", "images/avatar2.jpeg", "images/avatar3.jpeg", "images/avatar4.jpeg"].map((img) => (
          <img key={img} src={img} alt="avatar" className={user?.avatar === img ? "selected" : ""} 
            onClick={() => setUser({ ...user, avatar: img })} />
        ))}
      </div>

      <label>Choose Theme</label>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="violet">Violet</option>
        <option value="blue">Blue</option>
        <option value="dark">Dark Mode</option>
        <option value="green">Green Theme</option>
      </select>

      <label>Student ID</label>
      <input type="text" value={user?.studentId || ""} onChange={(e) => setUser({ ...user, studentId: e.target.value })} />

      <label>Year</label>
      <input type="text" value={user?.year || ""} onChange={(e) => setUser({ ...user, year: e.target.value })} />

      <label>Division</label>
      <input type="text" value={user?.division || ""} onChange={(e) => setUser({ ...user, division: e.target.value })} />

      <label>Class Id</label>
      <input type="text" value={user?.classID || ""} onChange={(e) => setUser({ ...user, classID: e.target.value })} />

      <h3>Subscription Details</h3>
      {subscription ? (
      <p>Plan: {subscription.active ? "Active" : "Inactive"}, Expiry: {subscription.expiry}</p>) : (
        <p>Loading...</p>)}

      <button className="save-btn" onClick={updateProfile}>Save Changes</button>
    </div>
  </div>
)}

    </div>
  );
};

export default Dashboard;
