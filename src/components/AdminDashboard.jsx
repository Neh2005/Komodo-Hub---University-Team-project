import React, { useEffect, useState } from "react";
import { db } from "../firebaseconfig"; // Ensure correct Firebase config import
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, addDoc } from "firebase/firestore";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import "./AdminDashboard.css"; // Import external styles if needed
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Register chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schoolCount, setSchoolCount] = useState(0);
  const [communityCount, setCommunityCount] = useState(0);
  const [generalEnthusiastCount, setGeneralEnthusiastCount] = useState(0);
  const [activeSubscriptions, setActiveSubscriptions] = useState(0);
  const adminId = "B7QFkCgIa4alfymtAcQPqoUCsYl2";
  const [activeSubscriptionsByMonth, setActiveSubscriptionsByMonth] = useState(Array(12).fill(0)); // Array for 12 months
  const [totalActiveSubscriptions, setTotalActiveSubscriptions] = useState(0);
  const [salesByMonth, setSalesByMonth] = useState(Array(12).fill(0));
  const [userDemographics, setUserDemographics] = useState([]);
  const [showPopup, setShowPopup] = useState(false); // ✅ State to control popup
  const [newProfileImage, setNewProfileImage] = useState(""); 
  const navigate = useNavigate();
  
  //***************************** Neha's part ******************************

  const exportDataToPDF = () => {
  const dashboardElement = document.querySelector(".admin-main-content");
  
    if (!dashboardElement) {
      alert("Error: Dashboard content not found!");
      return;
    }
  
    // ✅ Capture the entire dashboard as an image
    html2canvas(dashboardElement, {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      scrollX: 0,
      scrollY: -window.scrollY, // Capture the entire visible area
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
  
      // ✅ Create PDF document in A4 size
      const pdf = new jsPDF("p", "mm", "a4");
  
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio
  
      // ✅ If content is too long, scale it down
      const maxHeight = 285; // Keep some margin
      let finalHeight = imgHeight;
  
      if (imgHeight > maxHeight) {
        finalHeight = maxHeight; // Scale down the image to fit
      }
  
      // ✅ Add the captured image to fit exactly on **one** page
      pdf.addImage(imgData, "PNG", 0, 5, imgWidth, finalHeight);

      pdf.setFontSize(12);
      pdf.text("User Demographics", 14, finalHeight + 10); // Place title below the image
  
      // ✅ Table Headers
      const headers = [["Name", "Role", "Subscription Status"]];
      const data = userDemographics.map((user) => [
        user.name || "N/A",
        user.role || "N/A",
        user.subscriptionActive || "N/A",
      ]);
  
      // ✅ Add Table Below Charts
      autoTable(pdf, {
        startY: finalHeight + 15, // Start table below the charts
        head: headers,
        body: data,
        theme: "striped",
        styles: { fontSize: 10 },
      });
  
      // ✅ Save the PDF
      pdf.save("Admin_Dashboard_Report.pdf");
    });
  }; // ********************************** Till here Neha's part ********************************
  

  // ***** Chalitha's part ***** 
  const [programs, setPrograms] = useState([]);
  const [newProgram, setNewProgram] = useState({
    date: "",
    description: "",
    title: "",
    image: "",
    enrolledUsers: [],
  });
  const [showProgramForm, setShowProgramForm] = useState(false);

  const fetchPrograms = async () => {
    try {
      const programsCollection = collection(db, "programs");
      const programsSnapshot = await getDocs(programsCollection);
      const programsList = programsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrograms(programsList);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleAddProgram = async (e) => {
    e.preventDefault();
    try {
      const programsCollection = collection(db, "programs");
      await addDoc(programsCollection, newProgram);
      alert("Program added successfully!");
      setNewProgram({ date: "", description: "", title: "", image: "", enrolledUsers: [] });
      fetchPrograms();
      setShowProgramForm(false);
    } catch (error) {
      console.error("Error adding program:", error);
    }
  };
  // *****TILL HERE CHALITHA'S PART ******


  //  ********************************************** Neha's Part**************************************
  const cancelSubscription = async (userId, role) => {
    try {
      // Determine the correct Firestore collection based on role
      let collectionPath = "";
      if (role === "School") collectionPath = "users/school/members";
      else if (role === "Community") collectionPath = "users/community/members";
      else if (role === "Community Member") collectionPath = "users/community_member/members";
      else if (role === "General Enthusiast") collectionPath = "users/general_enthusiast/members";
      else if (role === "Student") collectionPath = "users/student/members";
      else if (role === "Teacher") collectionPath = "users/teacher/members";
  
      if (!collectionPath) {
        alert("Invalid role. Cannot update subscription.");
        return;
      }
  
      // Firestore reference
      const userRef = doc(db, collectionPath, userId);
  
      // Update subscription status
      await updateDoc(userRef, { subscriptionActive: false });
  
      // Refresh the user list after updating - Neha's Part
      setUserDemographics((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, subscriptionActive: "Inactive" } : user
        )
      );
  
      alert("Subscription canceled successfully.");
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Failed to cancel subscription.");
    }
  };
  

  const deleteAccount = async (userId, role) => {
    try {
      // Determine the correct Firestore collection based on role
      let collectionPath = "";
      if (role === "School") collectionPath = "users/school/members";
      else if (role === "Community") collectionPath = "users/community/members";
      else if (role === "Community Member") collectionPath = "users/community_member/members";
      else if (role === "General Enthusiast") collectionPath = "users/general_enthusiast/members";
      else if (role === "Student") collectionPath = "users/student/members";
      else if (role === "Teacher") collectionPath = "users/teacher/members";
  
      if (!collectionPath) {
        alert("Invalid role. Cannot delete account.");
        return;
      }
  
      // Firestore reference
      const userRef = doc(db, collectionPath, userId);
  
      // Delete user from Firestore
      await deleteDoc(userRef);
  
      // Remove the user from the frontend state
      setUserDemographics((prevUsers) =>
        prevUsers.filter((user) => user.id !== userId)
      );
  
      alert("User account deleted successfully.");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Failed to delete account.");
    }
  };
   
  //*********************************** TILL HERE NEHA'S PART **********************************
  

  // ✅ Function to refresh data - *****Chalitha's part****
  const refreshData = () => {
    window.location.reload(); // Refresh the page
  };

  // ✅ Function to show notifications 
  const showNotifications = () => {
    alert("No new notifications."); // Replace with actual notification system
  };

  // ***** TILL HERE CHALITHA'S PART *****


  // ******************************************** Neha's part *************************************
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchUserDemographics(),
        fetchAdminDetails(),
        fetchUserCounts(),
        fetchActiveSubscriptions(),
      ]);
      setLoading(false);
    };

    fetchData();
  }, []);

  /** ✅ Fetch User Demographics from Different Collections */
  const fetchUserDemographics = async () => {
    try {
      // Define user categories and paths
      const userCategories = [
        { path: "users/school/members", role: "School" },
        { path: "users/community/members", role: "Community" },
        { path: "users/community_member/members", role: "Community Member" },
        { path: "users/general_enthusiast/members", role: "General Enthusiast" },
      ];

      let allUsers = [];

      // Fetch all users asynchronously
      await Promise.all(
        userCategories.map(async ({ path, role }) => {
          const snapshot = await getDocs(collection(db, path));
          snapshot.forEach((doc) => {
            const data = doc.data();
            allUsers.push({
              id: doc.id,
              name: data.name || "N/A",
              role: role,
              subscriptionActive: data.subscriptionActive ? "Active" : "Inactive",
            });
          });
        })
      );

      // Fetch students and teachers separately to check active subscriptions in `subscriptionDetails`
      await Promise.all(
        ["users/student/members", "users/teacher/members"].map(async (path) => {
          const snapshot = await getDocs(collection(db, path));

          await Promise.all(
            snapshot.docs.map(async (userDoc) => {
              const userData = userDoc.data();
              const userRole = path.includes("student") ? "Student" : "Teacher";

              // Fetch subscription details where status is active
            
              const isSubscribed = userData.subscriptionDetails?.active ? "Active" : "Inactive";

              allUsers.push({
                id: userDoc.id,
                name: userData.name || "N/A",
                role: userRole,
                subscriptionActive: isSubscribed,
              });
            })
          );
        })
      );

      setUserDemographics(allUsers);
    } catch (error) {
      console.error("🔥 Error fetching user demographics:", error);
    }
  }; // ************************************** Till here - Neha's part *******************************************


  /** ✅ Fetch Admin Data - *******Chalitha's Part *********/
  const fetchAdminDetails = async () => {
    try {
      const docRef = doc(db, "users", "admin", "members", adminId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setAdminData(docSnap.data());
      else setAdminData(null);
    } catch (error) {
      console.error("🔥 Error fetching admin data:", error);
    }
  }; 
  // ***** Till here Chalitha's part *****

  

  /** ✅ Fetch User Counts By Category - *******************************Neha's Part ************************************* */
  const fetchUserCounts = async () => {
    try {
      const schoolSnapshot = await getDocs(collection(db, "users", "school", "members"));
      setSchoolCount(schoolSnapshot.size);

      const communitySnapshot = await getDocs(collection(db, "users", "community", "members"));
      setCommunityCount(communitySnapshot.size);

      const enthusiastSnapshot = await getDocs(collection(db, "users", "general_enthusiast", "members"));
      setGeneralEnthusiastCount(enthusiastSnapshot.size);
    } catch (error) {
      console.error("🔥 Error fetching user counts:", error);
      setSchoolCount(0);
      setCommunityCount(0);
      setGeneralEnthusiastCount(0);
    }
  };

  /** ✅ Fetch Active Subscriptions */
  const fetchActiveSubscriptions = async () => {
    try {
      console.log("🔄 Fetching active subscriptions...");
  
      let monthlySubscriptions = Array(12).fill(0);
      let monthlySales = Array(12).fill(0);
      let totalActive = 0;
  
      console.log("📊 Initialized arrays:", monthlySubscriptions, monthlySales);
  
      const usersRef = [
        collection(db, "users", "school", "members"),
        collection(db, "users", "community", "members"),
        collection(db, "users", "general_enthusiast", "members"),
      ];
  
      const snapshots = await Promise.all(usersRef.map(ref => getDocs(ref)));
      console.log("📥 Retrieved user snapshots:", snapshots);
  
      snapshots.forEach((snapshot, index) => {
        console.log(`📂 Processing snapshot ${index + 1} with ${snapshot.size} documents`);
        snapshot.forEach((doc) => {
          const userData = doc.data();
          console.log("👤 User Data:", userData);
  
          if (userData.subscriptionActive && userData.subscriptionExpiry) {
            totalActive++;
            console.log("✅ Active subscription found.");
  
            let expiryDate;
            if (userData.subscriptionExpiry.toDate) {
              expiryDate = userData.subscriptionExpiry.toDate(); // Convert Firestore Timestamp to JS Date
            } else {
              expiryDate = new Date(userData.subscriptionExpiry);
            }
            console.log("📅 Subscription Expiry Date (Converted):", expiryDate);
  
            expiryDate.setFullYear(expiryDate.getFullYear() - 1);
            const startMonth = expiryDate.getMonth();
            console.log("📆 Calculated Start Month:", startMonth);
  
            if (startMonth >= 0 && startMonth < 12) {
              monthlySubscriptions[startMonth]++;
              console.log("📈 Updated Subscriptions Array:", monthlySubscriptions);
            }
  
            let category = userData.categoryPath || userData.category;
            let price = 0;
            if (category) {
              switch (category.toLowerCase()) {
                case "school":
                  price = 15;
                  break;
                case "community":
                  price = 20;
                  break;
                case "general_enthusiast":
                case "general enthusiast":
                  price = 5;
                  break;
                default:
                  console.warn("⚠️ Unknown category:", category);
                  price = 0; // Log unknown category for debugging
              }
            } else {
              console.warn("⚠️ Missing category information for user:", userData);
            }
  
            console.log("💲 Price for this subscription:", price);
            
            if (startMonth >= 0 && startMonth < 12) {
              monthlySales[startMonth] += price;
              console.log("💰 Updated Sales Array:", monthlySales);
            }
          }
        });
      });
  
      console.log("🔥 Final Active Subscriptions by Month:", monthlySubscriptions);
      console.log("🔥 Final Sales by Month:", monthlySales);
      console.log("🔥 Total Active Subscriptions:", totalActive);
  
      setActiveSubscriptionsByMonth([...monthlySubscriptions]);
      setSalesByMonth([...monthlySales]);
      setTotalActiveSubscriptions(totalActive);
    } catch (error) {
      console.error("🔥 Error fetching subscriptions:", error);
    }
  };

  const subscriptionData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Active Subscriptions",
        data: activeSubscriptionsByMonth,
        backgroundColor: "green",
        borderColor: "rgba(0, 128, 0, 0.5)",
        borderWidth: 1,
      },
    ],
  };

  const salesData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Total Sales (£)",
        data: salesByMonth,
        borderColor: "blue",
        backgroundColor: "transparent",
        borderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };// *******************************************************Till here Neha's part***************************************


  // **********Chalitha's part from here**********
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const imageUrl = reader.result; // Get base64 encoded image
      setNewProfileImage(imageUrl);

      // ✅ Save image URL in Firestore
      try {
        const docRef = doc(db, "users", "admin", "members", adminId);
        await updateDoc(docRef, { profilePicture: imageUrl });
        setAdminData((prev) => ({ ...prev, profilePicture: imageUrl }));
        alert("Profile picture updated successfully!");
      } catch (error) {
        console.error("🔥 Error updating profile picture:", error);
      }
    };
  };

  if (loading) return <p>Loading admin details...</p>; 
  
  // ***** Till here and Chalitha's Backend work is done.*******

  

  // ******Chalitha's work (front-end) from here till the part before chart as mentioned in the comments *******
  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-menu">
          <h2>Admin Panel</h2>
          <ul>
            <li><a href="/admin-dashboard"><i className="fas fa-home" style={{padding:"15px"}}></i>Dashboard</a></li>
            <li><a href="/admin-messages"><i className="fas fa-comments" style={{padding:"15px"}}></i> Messages</a></li>
            <li>
              <a href="#" onClick={() => setShowProgramForm(true)}><i className="fas fa-calendar-plus" style={{padding:"15px"}}></i>Add Program</a>
            </li>            
          </ul>
        </div>
        <a href="/login" className="admin-logout-btn">Logout</a>
      </div>

      <div className="admin-main-content">
      <div className="admin-dashboard-header">
          {/* ✅ Search Bar */}
        <div className="admin-search-bar">
          <input type="text" placeholder=" Search" />
        </div>

        {/* ✅ Admin Controls */}
        <div className="admin-controls">
  
          <button onClick={refreshData}>
            <i className="fas fa-exchange-alt"></i>
          </button>
         
         
          {/* Admin Profile Image */}
          <img
            src={adminData?.profilePicture || " "}
            alt="Admin Avatar"
            className="admin-avatar" style={{border: "1px solid black"}}
            onClick={() => setShowPopup(true)} // ✅ Show popup on click
          />
        </div>
      </div>

      {/* ✅ Admin Popup Modal */}
      {showPopup && (
        <div className="admin-popup-overlay">
          <div className="admin-popup-content">
            <h2>Admin Information</h2>
            <img
              src={adminData?.profilePicture || ""}
              alt="Admin Profile"
              className="admin-popup-avatar"
            />
            <p style={{marginLeft: "50px"}}><strong>Name:</strong> {adminData?.name || "N/A"}</p>
            <p style={{marginLeft: "50px"}}><strong>Email:</strong> {adminData?.email || "N/A"}</p>
            <p style={{marginLeft: "50px"}}><strong>Role:</strong> {adminData?.role || "N/A"}</p>

            {/* ✅ File Upload Button */}
            <label className="admin-upload-btn">
              Upload New Image
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>

            {/* ✅ Close Popup Button */}
            <button className="admin-close-btn" onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="admin-info">
        <span className="admin-welcome">
        Welcome Back, {adminData ? adminData.name : "Admin"}!
        </span>
      </div>

  

        {/* ✅ User Count Cards */}
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Number of Schools</h3>
            <p>{schoolCount}</p>
          </div>
          <div className="admin-card">
            <h3>Number of Communities</h3>
            <p>{communityCount}</p>
          </div>
          <div className="admin-card">
            <h3>Active Subscriptions</h3>
            <p>{totalActiveSubscriptions}</p>
          </div>
        </div>

{/* ✅ Quick Actions Section */}
<div className="admin-quick-actions">
  <h3>Quick Actions</h3>
  <div className="admin-quick-action-buttons">
    <button className="admin-quick-action-btn users-btn" onClick={() => {
    const userSection = document.getElementById("admin-users");
    if (userSection) {
      userSection.scrollIntoView({ behavior: "smooth" }); // ✅ Smooth scrolling to the section
    }
  }}><i className="fas fa-users"></i> View Users
    </button>
    <button className="admin-quick-action-btn subscriptions-btn" onClick={() => {
    const userSection = document.getElementById("admin-users");
    if (userSection) {
      userSection.scrollIntoView({ behavior: "smooth" }); // ✅ Smooth scrolling to the section
    }
  }}>
      <i className="fas fa-dollar-sign"></i> Manage Subscriptions
    </button>
    <button className="admin-quick-action-btn notifications-btn" onClick={() => navigate("/admin-messages")}>
      <i className="fas fa-bell"></i> Send Notifications
    </button>
    <button className="admin-quick-action-btn export-btn" onClick={exportDataToPDF}>
      <i className="fas fa-chart-pdf"></i> Export Data as PDF
    </button>
  </div>
</div>
 {/* ******* Till here Chalitha's part *******/}

      {/* ************************************* Neha's part ************************************ */}
        {/* ✅ Charts Section */}
        <div className="admin-charts">
          <div className="admin-chart-container">
            <h3>Subscription Trends</h3>
            <Bar data={subscriptionData} options={chartOptions} />
          </div>
          <div className="admin-chart-container">
            <h3>Annual Sales Report</h3>
            <Line data={salesData} options={chartOptions} />
          </div>
        </div> {/* ***************************************** Till here NEHA'S PART ********************************* */}


        {/* ****** Chalitha's part frontend of user demographics table******* */}
        <div className="user-demographics" id="admin-users">
          <h3>User Demographics</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Subscription Status</th>
                <th> Manage Subscriptions</th>
                <th> Manage accounts</th>
                
              </tr>
            </thead>
            <tbody>
              {userDemographics.map((user) => (
                <tr key={user.id}>
                
                  <td>{user.name}</td>
                  <td>{user.role}</td>
                  <td>{user.subscriptionActive}</td>
                  <td className="manage-subscriptions">
            {user.subscriptionActive === "Active" ? (
              <button
                className="admin-cancel-subscription-btn"
                onClick={() => cancelSubscription(user.id, user.role)}
              >
                Cancel Subscription
              </button>
            ) : (
              <span style={{ color: "gray" }}>No Active Subscription</span>
            )}
          </td>
          <td className="manage-accounts">
            <button
              className="admin-delete-account-btn"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete ${user.name}'s account?`)) {
                  deleteAccount(user.id, user.role);
                }
              }}
            >
              Delete Account
            </button>
          </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-main-programs">
        <h2>Programs</h2>
        <ul>
          {programs.map((program) => (
            <li key={program.id}>
              <h3>{program.title}</h3>
              <p>{program.description}</p>
              <img src={program.image} alt={program.title} width="100" />
            </li>
          ))}
        </ul>

        {showProgramForm && (
          <div className="program-form-overlay">
            <div className="program-form">
              <h2>Add New Program</h2>
              <form onSubmit={handleAddProgram}>
                <label>Date:</label>
                <input type="date" value={newProgram.date} onChange={(e) => setNewProgram({ ...newProgram, date: e.target.value })} required />
                
                <label>Title:</label>
                <input type="text" value={newProgram.title} onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })} required />
                
                <label>Description:</label>
                <textarea value={newProgram.description} onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })} required />
                
                <label>Image URL:</label>
                <input type="text" value={newProgram.image} onChange={(e) => setNewProgram({ ...newProgram, image: e.target.value })} required />
                
                <button type="submit">Add Program</button>
                <button type="button" onClick={() => setShowProgramForm(false)}>Cancel</button>
              </form>
            </div>
          </div> 
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 /* ****** Chalitha's Part on the programs till here ****** */