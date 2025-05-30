
/* ******************** Revan's part execpt some parts as in the comments***************** */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import Dropdown from "react-bootstrap/Dropdown";
import "../styles/styles.css"; // Import the CSS file
import "bootstrap/dist/css/bootstrap.min.css";

const Header = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // Store user role
  const auth = getAuth();
  const db = getFirestore(); // Initialize Firestore

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 🔥 Fetch the user's role from Firestore
        const roles = ["student", "teacher", "admin"];
        for (const role of roles) {
          const userRef = doc(db, `users/${role}/members`, currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserRole(role); // ✅ Set the role if found
            break;
          }
        }
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img src="/images/logo.webp" alt="Komodo Hub Logo" /> Komodo Hub
          </Link>

          {/* Mobile Toggle Button */} 
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav mx-auto">
              <li className="nav-item custom-nav-style"><Link className="nav-link" to="/">Home</Link></li>
              <li className="nav-item custom-nav-style"><a className="nav-link" href="#about">About</a></li>
              <li className="nav-item custom-nav-style"><a className="nav-link" href="#partners">Partners</a></li>
              <li className="nav-item custom-nav-style"><a className="nav-link" href="#games">Games</a></li>
              <li className="nav-item custom-nav-style"><a className="nav-link" href="#faq-section">FAQs</a></li>
            </ul>

            {/* 🔥 Mobile Menu (When Toggle Button is Clicked) */}
            <ul className="navbar-nav d-lg-none">
              {user ? (
                // If user is logged in, show dropdown
                <li className="nav-item d-flex align-items-center">
                  <Dropdown>
                    <Dropdown.Toggle variant="light" id="profile-dropdown" className="border-0 bg-white d-flex align-items-center">
                      <img src="/images/user.png" alt="Profile" width="30" className="rounded-circle me-2" />
                    </Dropdown.Toggle>

                    <Dropdown.Menu align="start">
                     
                      
                      {/* 🔥 Dynamic Dashboard or Library Link -***************** Neha's part ******************* */}
                      {userRole === "student" ? (
                      <Dropdown.Item as={Link} to="/studentdashboard">Back to Student Dashboard</Dropdown.Item>
                      ) : userRole === "teacher" ? (
                      <Dropdown.Item as={Link} to="/teacher-dashboard">Back to Teacher Dashboard</Dropdown.Item>
                      ) : userRole === "admin" ? (
                      <Dropdown.Item as={Link} to="/admin-dashboard">Back to Admin Dashboard</Dropdown.Item>
                      ) : (
                      <Dropdown.Item as={Link} to="/library">Back to Library</Dropdown.Item>
                      )}

                      {/* ***************** Till here Neha's part *******************  */}
                      
                      <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </li>
              ) : (
                // If user is NOT logged in, show Login & Signup buttons
                <>
                  <li className="nav-item">
                    <Link className="nav-link  custom-nav-style" to="/login">Login</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link  custom-nav-style" to="/signup">Sign Up</Link>
                  </li>
                </>
              )}
            </ul>
          </div> 

          

          {/* 🔥 Show Login & Sign Up if not logged in (Desktop Only) */}
          {!user ? (
            <div className="d-none d-lg-flex">
              <Link className="btn btn-outline-dark me-2" to="/login">Login</Link>
              <Link className="btn btn-dark" to="/signup">Sign Up</Link>
            </div>
          ) : (
            /* Show Profile Dropdown on Desktop - Revan's part */
            <div className="d-none d-lg-block">
              <Dropdown>
                <Dropdown.Toggle variant="light" id="profile-dropdown" className="border-0 bg-white">
                  <img src="/images/user.png" alt="Profile" width="35" className="rounded-circle" />
                </Dropdown.Toggle>

                <Dropdown.Menu align="end">
                  
                  
                  {/* 🔥 Dynamic Dashboard or Library Link - ***************** Neha's part ********************/}
                  {userRole === "student" ? (
                  <Dropdown.Item as={Link} to="/studentdashboard">Back to Student Dashboard</Dropdown.Item>
                  ) : userRole === "teacher" ? (
                  <Dropdown.Item as={Link} to="/teacher-dashboard">Back to Teacher Dashboard</Dropdown.Item>
                  ) : userRole === "admin" ? (
                  <Dropdown.Item as={Link} to="/admin-dashboard">Back to Admin Dashboard</Dropdown.Item>
                  ) : (
                  <Dropdown.Item as={Link} to="/library">Back to Library</Dropdown.Item>
                  )}

                  {/* ***************** Till here Neha's part *******************  */}

                  <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div> 
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header; {/*Revan's part Till here */}
