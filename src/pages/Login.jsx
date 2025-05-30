
/* *** Dhanya's part except some parts as commented *** */

import React, { useState } from "react";
import "./Login.css"; // Import CSS
import { auth, db, signInWithGoogle } from "../firebaseconfig";
import { signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [resetEmail, setResetEmail] = useState(""); // For password reset
  const [showResetForm, setShowResetForm] = useState(false); // Toggle Reset Password form
  const [resendVerification, setResendVerification] = useState(false); // Show resend email option
  const [checkingVerification, setCheckingVerification] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // **** Revan's part ***
  const auth = getAuth();
    console.log("🔥 User ID:", auth.currentUser?.uid); 

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  // 🔹 Determine where to redirect based on user category
  const redirectUser = async (userId) => {
    try {
      console.log("🔍 Fetching user data for ID:", userId);
  
      // ✅ Manually check each category path
      const categoryPaths = ["school", "student", "teacher", "community", "admin", "community_member", "environment_enthusiast", "general_enthusiast"];
  
      let userData = null;
      let categoryPathFound = "";
  
      for (const category of categoryPaths) {
        const userRef = doc(db, "users", category, "members", userId);
        console.log(`📌 Checking Firestore Path: users/${category}/members/${userId}`);
  
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          userData = userSnap.data();
          categoryPathFound = category;
          console.log("✅ User data found in category collection:", userData);
          break; // Exit loop if user is found
        }
      }
  
      if (!userData) {
        console.error(`❌ User document NOT found in any category.`);
        setMessage("⚠ User data not found.");
        return;
      }
  
      // ✅ Redirect user based on category
      switch (categoryPathFound) {
        case "school":
          navigate("/library");
          break;
        case "student":
          navigate("/studentdashboard");
          break;
        case "teacher":
          navigate("/teacher-dashboard");
          break;
        case "community":
          navigate("/library");
          break;
        case "admin":
          navigate("/admin-dashboard");
          break;
        case "community_member":
          navigate("/library");
          break;
        case "environment_enthusiast":
        case "general_enthusiast":
          navigate("/library");
          break;
        default:
          navigate("/home");
      }
    } catch (error) {
      console.error("❌ Firestore Read Error:", error);
      setMessage("⚠ Error fetching user data.");
    }
  };
  /* *** Till here Revan's part *** */
  
  /* *** Dhanya's part *** */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setResendVerification(false);

    if (!formData.email || !formData.password) {
      setMessage("⚠ Please fill all fields.");
      return;
    }

    if (!validateEmail(formData.email)) {
      setMessage("⚠ Please enter a valid email address.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await user.reload();

    /* ****** TILL HERE DHANYA'S PART  ****** */

    /* ****** REVAN'S PART ******* */ // 🔹 Check if email is verified before allowing login
      if (!user.emailVerified) {
        setMessage("⚠ Your email is not verified. Please check your inbox.");
        setResendVerification(true);
        return;
      }

      console.log("User Logged In:", user);
      setMessage("✅ Login successful! Redirecting...");

      // Redirect user based on their category
      await redirectUser(user.uid);
    } catch (error) {
      console.error("Login Error:", error);
      setMessage(`⚠ Login Failed: ${error.message}`);
    }
  };

  // 🔹 Resend Verification Email
  const handleResendVerification = async () => {
    try {
      const user = auth.currentUser;

      if (user) {
        await sendEmailVerification(user);
        setMessage("✅ Verification email sent! Please check your inbox.");
        setResendVerification(false); // Hide the resend option after sending
      } else {
        setMessage("⚠ Error: No user is logged in to resend verification.");
      }
    } catch (error) {
      console.error("Resend Verification Error:", error);
      setMessage(`⚠ Failed to resend verification email: ${error.message}`);
    }
  };

  // 🔹 Check verification status manually
  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    const user = auth.currentUser;

    if (user) {
      await user.reload();
      console.log("Email Verified Status:", user.emailVerified);
      if (user.emailVerified) {
        setMessage("✅ Your email is now verified! Please log in again.");
        setResendVerification(true);
      } else {
        setMessage("⚠ Email is still not verified. Please check your inbox.");
      }
    }

    setCheckingVerification(false);
  };
  {/* ***** TILL HERE REVAN'S PART ***** */}


  {/* *****************NEHA'S PART************************ */}// Handle Google Login (Google Users Are Auto-Verified)
  const handleGoogleLogin = async () => {
    try {
      const user = await signInWithGoogle();
      console.log("Google User:", user);
      setMessage(`✅ Welcome, ${user.displayName}! Redirecting...`);
      
      await redirectUser(user.uid);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setMessage("⚠ Google Sign-in failed. Try again.");
    }
  }; 
  {/* *************************** TILL HERE NEHA'S PART *************************** */}

  
  {/* ***** REVAN'S PART ***** */}// Handle Forgot Password Form Toggle
  const toggleResetForm = () => {
    setShowResetForm(!showResetForm);
    setMessage("");
  };

  // Handle Password Reset Request
  const handlePasswordReset = async () => {
    if (!validateEmail(resetEmail)) {
      setMessage("⚠ Please enter a valid email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setMessage("✅ Reset email sent! Check your inbox.");
    } catch (error) {
      console.error("Reset Password Error:", error);
      setMessage(`⚠ Reset Failed: ${error.message}`);
    }
  }; 
  {/* ***** TILL HERE REVAN'S PART ***** */}


  {/* ********** DHANY'S PART ************ */}
  return (
    <div className="login-container">
      <div className="left-section">
        <div className="overlay">
          <h2 className="brand-title">Welcome to Komodo Hub</h2>
          <p className="brand-text">A smarter way to collaborate and grow.</p>
        </div>
      </div>

      <div className="right-section">
        <div className="form-box">
          <h2 className="text-center mb-4 fw-bold">Login</h2>

          {!showResetForm ? (
            <form onSubmit={handleSubmit}>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <label>Email</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <label>Password</label>
              </div>

              <button type="submit" className="btn login-btn w-100">Login</button>
              <button type="button" className="google-btn w-100" onClick={handleGoogleLogin}>
                <img src="/images/google-icon.jpg" alt="Google" className="google-icon" />
                Login with Google
              </button>

              <p className="forgot-password" onClick={toggleResetForm}>Forgot Password?</p>

              {resendVerification && (
                <p className="resend-verification" onClick={handleResendVerification}>Resend Verification Email</p>
              )}

              <p className="signup-link">Don't have an account? <a href="/signup">Sign Up</a></p>
            </form>
          ) : (
            <div>
              <h3 className="text-center mb-3">Reset Password</h3>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
                <label>Email</label>
              </div>
              <button className="btn reset-btn w-100" onClick={handlePasswordReset}>Send Reset Link</button>
              <p className="back-to-login" onClick={toggleResetForm}>Back to Login</p>
            </div>
          )}

          {message && <p className="login-message">{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;

{/* ****** TILL HERE DHANYA'S PART *****  */}
