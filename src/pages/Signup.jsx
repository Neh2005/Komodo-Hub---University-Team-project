/* **** Revan's part except some as commented**** */

import React, { useState } from "react";
import "./Signup.css";
import { auth, db, signInWithGoogle } from "../firebaseconfig";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { collection, doc, setDoc } from "firebase/firestore";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    email: "",
    contact: "",
    password: "",
    institute: "",
    schoolCode: "",
  });

  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSchoolCode, setShowSchoolCode] = useState(false);
  const [showInstituteFields, setShowInstituteFields] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "category") {
      if (["School", "Community"].includes(value)) {
        setShowSchoolCode(true);
        setShowInstituteFields(false);
      } else if (["Student", "Teacher", "Community Member"].includes(value)) {
        setShowSchoolCode(true);
        setShowInstituteFields(true);
      } else {
        setShowSchoolCode(false);
        setShowInstituteFields(false);
      }
    }
  };

  const storeUserData = async (user, additionalData) => {
    if (!user) return;

    let categoryPath = additionalData.category.toLowerCase().replace(/\s+/g, "_"); // Format category
    const userCollectionRef = collection(db, "users", categoryPath, "members"); // Store in sub-collection
    const userRef = doc(userCollectionRef, user.uid);
    
    const userData = {
      uid: user.uid,
      name: additionalData.name,
      email: user.email,
      category: additionalData.category,
      contact: additionalData.contact,
      institute: additionalData.institute || null,
      profilePic: user.photoURL || null,
      role: categoryPath, // Assign formatted category as role
      createdAt: new Date(),
      isPublic: additionalData.category === "Community",
      schoolCode: additionalData.schoolCode || null,
      classID: additionalData.category === "Student" ? additionalData.classID || null : null,
      grade: additionalData.category === "Student" ? additionalData.grade || null : null,
      division: additionalData.category === "Student" ? additionalData.division || null : null,
    };

    await setDoc(userRef, userData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.name || !formData.category || !formData.email || !formData.contact || !formData.password) {
      setMessage("⚠ Please fill all fields.");
      return;
    }

    if (showInstituteFields && !formData.institute) {
      setMessage("⚠ Please provide the Institute/Community name.");
      return;
    }

    if (showSchoolCode && !formData.schoolCode) {
      setMessage("⚠ Please enter the unique school code.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      setMessage("⚠ Password must contain at least one uppercase letter, one number, and one special character.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await sendEmailVerification(userCredential.user);
      await storeUserData(userCredential.user, formData);
      setMessage("✅ Signup successful! A verification email has been sent. Please verify before logging in.");

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Signup Error:", error);
      setMessage(`⚠ Signup Failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  {/* ******************************* NEHA'S PART ******************* */}
  const handleGoogleSignup = async () => {
    try {
      const user = await signInWithGoogle();

      const defaultCategory = "General Enthusiast";
      let categoryPath = defaultCategory.toLowerCase().replace(/\s+/g, "_");

      const userCollectionRef = collection(db, "users", categoryPath, "members");
      const userRef = doc(userCollectionRef, user.uid);

      const userData = {
        uid: user.uid,
        name: user.displayName || "",
        email: user.email,
        category: defaultCategory,
        contact: "",
        profilePic: user.photoURL || null,
        role: categoryPath,
        createdAt: new Date(),
      };

      await setDoc(userRef, userData);

      setMessage(`✅ Welcome, ${user.displayName}! Redirecting...`);
      setTimeout(() => navigate("/library"), 2000);
    } catch (error) {
      setMessage("⚠ Google Sign-up failed. Try again.");
    }
  };

  /* ************************* TILL HERE NEHA'S PART ************************* */

  return (
    <div className="signup-container">
      <div className="left-section">
        <div className="overlay">
          <h2 className="brand-title">Join Komodo Hub</h2>
          <p className="brand-text">A smarter way to collaborate and grow.</p>
        </div>
      </div>

      <div className="right-section">
        <div className="form-box">
          <h2 className="text-center fw-bold">Sign Up</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Category</label>
              <select name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Community Member">Community Member</option>
                <option value="School">School</option>
                <option value="Community">Community</option>
                <option value="General Enthusiast">General Enthusiast</option>
              </select>
            </div>

            <div className="input-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Contact No</label>
              <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required />
            </div>

            {showInstituteFields && (
              <div className="input-group">
                <label>Institute/Community</label>
                <input type="text" name="institute" value={formData.institute} onChange={handleChange} required />
              </div>
            )}

            {showSchoolCode && (
              <div className="input-group">
                <label>Unique Code</label>
                <input type="text" name="schoolCode" value={formData.schoolCode} onChange={handleChange} required />
              </div>
            )}

            <button type="submit" className="signup-btn" disabled={isLoading}>{isLoading ? "Signing up..." : "Sign Up"}</button>

            <button type="button" className="google-btn" onClick={handleGoogleSignup}>
              <img src="/images/google-icon.jpg" alt="Google" className="google-icon" />
              Sign up with Google
            </button>

            <p className="login-link">Already have an account? <a href="/login">Login</a></p>

            {message && <p className="message">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
