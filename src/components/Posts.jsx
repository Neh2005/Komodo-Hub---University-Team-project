
// Dhanya's Part except the parts mentioned in the comments.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { db, collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "../firebaseconfig"; 
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./PublicPlatform.css";

const Posts = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);

  const auth = getAuth();

  // ✅ Monitor Authentication State - *********************** Neha's part ************************
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []); // ************************ Till here Neha's part *******************

  // ✅ Handle File Selection (Convert to Blob) - *********************** Neha's part ****************
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };// ************************* Till here Neha's part ******************

  // ✅ Convert File to Base64 - ************************* Neha's part *******************
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }; // ******************************** Till here Neha's part************************

  // ✅ Handle Post Submission (Save File + Text to Firestore) - *** Dhanya's part ***
  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() && !file) {
      alert("Please enter a title or upload a file.");
      return;
    }

    if (!user) {
      alert("You must be logged in to post.");
      return;
    }

    try {
      let fileData = null;
      let fileType = null;
      let fileName = null;

      // ✅ Convert file to Base64 if present - Only this part ****************(Neha's part)*******************
      if (file) {
        fileData = await convertFileToBase64(file);
        fileType = file.type;
        fileName = file.name;
      } // ************************till here Neha's part**************


      // ✅ Fetch the user's role before saving the post - ****** Dhanya's part *******
      const userDoc = await getDoc(doc(db, "users", user.email));
      const userRole = userDoc.exists() ? userDoc.data().role : "unknown";

      const postCreator = userRole === "student" ? "Anonymous" : (user.displayName || user.email); // *** Till here Dhanya's part ***


      // ✅ Save post (with document as Blob) in Firestore -******************* Neha's part from here *********************
      await addDoc(collection(db, "posts"), {
        title,
        content,
        fileData,
        fileType,
        fileName,
        userEmail: user.email,
        createdBy: postCreator,
        userRole, // ✅ Store the author's role
        timestamp: new Date(),
      }); // ******************* Till here - Neha's part*****************************


      // ✅ Reset form & fetch updated posts - *** Dhanya's part ***

      setTitle("");
      setContent("");
      setFile(null);
      fetchPosts();
    } catch (error) {
      console.error("❌ Error adding post:", error);
      alert("Failed to submit post.");
    }
  };

  // ✅ Handle Post Deletion (Only if user owns the post) 
  const handleDeletePost = async (postId, postOwnerEmail) => {
    if (user?.email !== postOwnerEmail) {
      alert("You can only delete your own posts.");
      return;
    }

    try {
      await deleteDoc(doc(db, "posts", postId));
      fetchPosts(); // Refresh posts after deletion
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  // ✅ Fetch Posts from Firestore (Including User Roles) 
  const fetchPosts = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "posts"));
        const postsArray = querySnapshot.docs.map((document) => {
            const postData = document.data();

            return {
                id: document.id,
                ...postData,
                createdBy: postData.userRole === "student" ? "Anonymous" : postData.createdBy, // ✅ Ensure Anonymous for students
            };
        });

        setPosts(postsArray);
    } catch (error) {
        console.error("❌ Error fetching posts:", error);
        alert("Failed to load posts.");
    }
};


  useEffect(() => {
    fetchPosts();
  }, []); 
  
  // ***Till here Dhanya's part (Backend)***

  // *** Dhanya's part front-end from here till***

  return (
    <div className="post-library-page">
      <Header />
      <div className="library-container">
        <aside className="library-sidebar">
          <h4>Library Dashboard</h4>
          <Link to="/posts">Posts</Link>
          <Link to="/discussionforum">Discussion</Link>
          <Link to="/wildlife">Wildlife Encyclopedia</Link>
          <Link to="/library">Account</Link>
        </aside>

        <main className="library-content">
          <h2>Welcome to the Library Dashboard</h2>

          {/* ✅ Displaying Posts */}
          <section className="library-posts-section">
            <h3>Recent Posts</h3>
            {posts.length === 0 ? (
              <p>No posts available yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="library-post-card">
                  <div className="library-post-header">
                    <h4>{post.title}</h4>
                    {/* ✅ Show Delete Button ONLY if the logged-in user is the post owner */}
                    {user?.email === post.userEmail && (
                      <button
                        className="library-delete-button"
                        onClick={() => handleDeletePost(post.id, post.userEmail)}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                  <p>{post.content}</p>
                  <p>
                  <strong>Posted by:</strong> {post.createdBy}
                  </p>

                  {/* ✅ Display Download Link if File Exists - ***************Neha's part**************/}
                  {post.fileData && post.fileType && post.fileName && (
                    <a
                      href={post.fileData}
                      download={post.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📂 {post.fileName}
                    </a>
                  )} {/* **************** TILL HERE NEHA's part ***********************/}
                </div>
              ))
            )}
          </section>

          {/* ✅ Post Submission Box */}
          {user ? (
            <section className="library-conversation-box">
              <h3>Write or Upload an Article</h3>
              <form onSubmit={handlePostSubmit}>
                <input
                  type="text"
                  placeholder="Enter Post Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <textarea
                  placeholder="Write your article..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                ></textarea>
                <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
                <button type="submit" className="btn primary-btn">Submit Post</button>
              </form>
            </section>
          ) : (
            <p className="error-message">🔒 You must be logged in to submit posts.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default Posts; // **** Till Here DHANYA's PART EXCEPT THE DOWNLOAD LINK PART AS COMMENTED ****
