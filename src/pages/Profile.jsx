
// Except Subscription part everything else is Maneesh's part as mentioned in the Comments

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebaseconfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";
import "./Profile.css"; // Ensure you have a Profile.css file for styling

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: "",
    category: "",
    email: "",
    contact: "",
    bio: "",
    website: "",
    location: "",
    subscriptionActive: false, // ✅ Track subscription status
    subscriptionExpiry: null, // ✅ Store expiry date
    theme: "light" ,
    
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [iconFile, setIconFile] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // ✅ Show/hide payment form
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardType: "",
  });

  const navigate = useNavigate();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        console.log("🔍 Fetching user data for ID:", user.uid);

        // ✅ Check all possible category paths
        const categoryPaths = ["school", "student", "teacher", "community","admin","community_member", "general_enthusiast"];

        let userData = null;
        let categoryPathFound = "";

        for (const category of categoryPaths) {
          const userRef = doc(db, "users", category, "members", user.uid);
          console.log(`📌 Checking Firestore Path: users/${category}/members/${user.uid}`);

          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setProfileData(userSnap.data());
            userData = userSnap.data();
            categoryPathFound = category;
            console.log("✅ User data found:", userData);
            break; // Stop searching once found
          }
        }

        if (!userData) {
          console.error("❌ User document NOT found in Firestore.");
          setMessage("⚠ User data not found.");
          return;
        }

        let isSubscribed = false;
        let expiryDate = "Not Subscribed";

         // ✅ Fix subscriptionExpiry handling
         if (categoryPathFound === "student") {
          // 🔹 Special handling for students
          if (userData.subscriptionDetails) {
            isSubscribed = userData.subscriptionDetails.active || false;
            expiryDate = userData.subscriptionDetails.expiry || "Not Subscribed";
          }
        } else {
          // 🔹 Standard handling for other categories
          if (userData.subscriptionExpiry) {
            if (userData.subscriptionExpiry.toDate) {
              expiryDate = userData.subscriptionExpiry.toDate().toDateString();
            } else if (typeof userData.subscriptionExpiry === "string") {
              expiryDate = new Date(userData.subscriptionExpiry).toDateString();
            }
          }
          isSubscribed = userData.subscriptionActive || false;
        }

      setProfileData({
        ...userData,
        subscriptionActive: isSubscribed,
        subscriptionExpiry: expiryDate,
        categoryPath: categoryPathFound,
      });

    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      setMessage("⚠ Error loading profile.");
    }
  };

  fetchUserProfile();
}, []);


  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("⚠ You must be logged in to update your profile.");
      return;
    }

    setIsLoading(true);
    try {
      // 🔹 Detect the correct category path
      const categoryPath = profileData.category.toLowerCase().replace(/ /g, "_");

      // ✅ Correct Firestore path
      const userRef = doc(db, "users", categoryPath, "members", user.uid);
      console.log(`📌 Updating Firestore Path: users/${categoryPath}/members/${user.uid}`);

      await setDoc(userRef, profileData, { merge: true });

      setMessage("✅ Profile updated successfully!");
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      setMessage("⚠ Failed to update profile.");
    }
    setIsLoading(false);
  };



  // 🔹 Dummy Payment Processing (Activates Subscription) - ******** CHALITHA'S PART ********
  const handlePaymentChange = (e) => {
    setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv || !paymentDetails.cardType) {
      setMessage("⚠ Please fill in all payment details.");
      return;
    }

    setIsLoading(true);

    try {
      setMessage("⏳ Processing payment... Please wait.");
      setTimeout(async () => {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        const userRef = doc(db, "users", profileData.categoryPath, "members", auth.currentUser.uid);
        await updateDoc(userRef, {
          subscriptionActive: true,
          subscriptionExpiry: newExpiryDate,
        });

        setProfileData({
          ...profileData,
          subscriptionActive: true,
          subscriptionExpiry: newExpiryDate.toDateString(),
        });

        setMessage("✅ Payment successful! Subscription activated.");
        setShowPaymentModal(false);
        setIsLoading(false);
      }, 3000);

    } catch (error) {
      console.error("❌ Payment Error:", error);
      setMessage("⚠ Failed to activate subscription.");
      setIsLoading(false);
    }
  };

    // 🔹 Cancel Subscription
    const handleCancelSubscription = async () => {
      const user = auth.currentUser;
      if (!user) {
        setMessage("⚠ You must be logged in to cancel the subscription.");
        return;
      }
  
      if (!window.confirm("Are you sure you want to cancel your subscription?")) {
        return;
      }
  
      setIsLoading(true);
  
      try {
        // 🔹 Detect the correct category path
        const categoryPath = profileData.category.toLowerCase().replace(/ /g, "_");
  
        // ✅ Update Firestore subscription status
        const userRef = doc(db, "users", categoryPath, "members", user.uid);
        await updateDoc(userRef, {
          subscriptionActive: false,
          subscriptionExpiry: null,
        });
  
        setProfileData({
          ...profileData,
          subscriptionActive: false,
          subscriptionExpiry: "Cancelled",
        });
  
        setMessage("✅ Subscription cancelled successfully.");
      } catch (error) {
        console.error("❌ Cancellation Error:", error);
        setMessage("⚠ Failed to cancel subscription.");
      }
  
      setIsLoading(false);
    };
  // ******* Till here CHALITHA'S PART ********
    
  

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2 className="text-center">Your Profile</h2>

     
        <div className="input-group">
          <label>Full Name</label>
          <input type="text" name="name" value={profileData.name} onChange={handleChange} required />
        </div>



        <div className="input-group">
          <label>Category</label>
          <select name="category" value={profileData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            <option value="School">School</option>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Admin">Admin</option>
            <option value="Community">Community</option>
            <option value="Community Member">Community Member</option>
            <option value="General Enthusiast">General Enthusiast</option>
          </select>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input type="email" name="email" value={profileData.email} disabled required />
        </div>

        <div className="input-group">
          <label>Contact No</label>
          <input type="tel" name="contact" value={profileData.contact} onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>Bio</label>
          <textarea name="bio" value={profileData.bio} onChange={handleChange} placeholder="Tell us about yourself..."></textarea>
        </div>

        <div className="input-group">
          <label>Website (if any)</label>
          <input type="url" name="website" value={profileData.website} onChange={handleChange} placeholder="https://example.com" />
        </div>

        <div className="input-group">
          <label>Location</label>
          <input type="text" name="location" value={profileData.location} onChange={handleChange} placeholder="City, Country" />
        </div>

        {/* 🔹 Subscription Status Section - ****** CHALITHA'S PART *******/}
        <div className="subscription-section">
          <h3>Subscription Status</h3>
          <p>
            <strong>Status:</strong> {profileData.subscriptionActive ? "✅ Active" : "❌ Expired"}
          </p>
          <p>
            <strong>Expires On:</strong> {profileData.subscriptionExpiry}
          </p>

        {!profileData.subscriptionActive && (
        <button className="library-subscribe-btn" onClick={() => setShowPaymentModal(true)} disabled={isLoading}>
        {isLoading ? "Processing..." : "Activate Subscription"}
        </button>
        )}


          {profileData.subscriptionActive && (
          <button className="library-cancel-btn" onClick={handleCancelSubscription} disabled={isLoading}>
          {isLoading ? "Cancelling..." : "Cancel Subscription"}
          </button>
          )}
        </div>

          
        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <div className="payment-modal-content">
              <h3>Enter Payment Details</h3>
              <form onSubmit={handlePaymentSubmit}>
                <div className="payment-input-group">
                  <label>Card Type</label>
                  <select name="cardType" value={paymentDetails.cardType} onChange={handlePaymentChange} required>
                    <option value="">Select Card Type</option>
                    <option value="Visa">Visa</option>
                    <option value="MasterCard">MasterCard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>

                <div className="payment-input-group">
                  <label>Card Number</label>
                  <input type="text" name="cardNumber" value={paymentDetails.cardNumber} onChange={handlePaymentChange} required />
                </div>

                <div className="payment-input-group">
                  <label>Expiry Date</label>
                  <input type="text" name="expiryDate" value={paymentDetails.expiryDate} onChange={handlePaymentChange} placeholder="MM/YY" required />
                </div>

                <div className="payment-input-group">
                  <label>CVV</label> 
                  <input type="text" name="cvv" value={paymentDetails.cvv} onChange={handlePaymentChange} required />
                </div>

                <button type="submit" className="pay-btn" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Submit Payment"}
                </button>
              </form>

              <button className="payment-close-btn" onClick={() => setShowPaymentModal(false)}> Close </button>
            </div>
          </div>
        )}

        <button className="library-save-btn" onClick={handleSaveProfile} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Profile"}
        </button>

        <button className="library-back-btn" onClick={() => navigate("/login")}>Logout</button>

        {message && <p className="message">{message}</p>}
      </div> {/* ******* TILL HERE CHALITHA"S PART ******** */}
    </div>
  );
};

export default Profile;
