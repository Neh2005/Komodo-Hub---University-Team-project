
/* ***************************** Revan's part except the parts that are commented otherwise*****************************/

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import {  db,  collection,  addDoc,  getDocs,  deleteDoc,  doc,  getDoc,  updateDoc} from "../firebaseconfig"; // ✅ Firestore imports
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./DiscussionForum.css"; // CSS file

const DiscussionForum = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedPostId, setExpandedPostId] = useState(null); // For opening replies
  const [replies, setReplies] = useState({}); // Stores replies per post
  const auth = getAuth();

  // ✅ Monitor Authentication State - *************** Neha's part*****************************
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Handle File Selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // ✅ Convert File to Base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }; // *************** Till here Neha's part*****************************


  // ✅ Handle Discussion Post Submission - Revan's part
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

      if (file) {//****************** Neha's part **********************
        fileData = await convertFileToBase64(file);
        fileType = file.type;
        fileName = file.name;
      }

      await addDoc(collection(db, "discussion"), {
        title,
        content,
        fileData,
        fileType,
        fileName,
        userEmail: user.email,
        createdBy: user.displayName || user.email,
        timestamp: new Date(),
      });

      setTitle("");
      setContent("");
      setFile(null);
      fetchPosts();
    } catch (error) {
      console.error("❌ Error adding discussion post:", error);
      alert("Failed to submit post.");
    }
  }; 

  // ✅ Handle Post Deletion
  const handleDeletePost = async (postId, postOwnerEmail) => {
    if (user?.email !== postOwnerEmail) {
      alert("You can only delete your own posts.");
      return;
    }

    try {
      await deleteDoc(doc(db, "discussion", postId));
      fetchPosts();
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert("Failed to delete post.");
    }
  }; // Till here Neha's part **********************************


  // ✅ Fetch Discussion Posts - ***Revan's part*** 
  const fetchPosts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "discussion"));
      const postsArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsArray);
    } catch (error) {
      console.error("❌ Error fetching discussion posts:", error);
      alert("Failed to load posts.");
    }
  };

  const handleReplySubmit = async (postId) => {
    if (!replyContent.trim()) return;
    if (!user) {
      alert("You must be logged in to reply.");
      return;
    }
  
    try {
      const postRef = doc(db, "discussion", postId);
      const repliesRef = collection(postRef, "replies");
  
      await addDoc(repliesRef, {
        content: replyContent,
        userEmail: user.email,
        createdBy: user.displayName || user.email,
        timestamp: new Date(),
      });
  
      setReplyContent("");
      fetchReplies(postId); // ✅ Fetch updated replies
    } catch (error) {
      console.error("❌ Error submitting reply:", error);
      alert("Failed to submit reply.");
    }
  };
  

  // ✅ Fetch Replies for a Post
  const fetchReplies = async (postId) => {
    try {
      const postRef = doc(db, "discussion", postId);
      const repliesRef = collection(postRef, "replies");
      const querySnapshot = await getDocs(repliesRef);
  
      const repliesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setReplies((prevReplies) => ({
        ...prevReplies,
        [postId]: repliesArray,
      }));
    } catch (error) {
      console.error("❌ Error fetching replies:", error);
    }
  }; // TIll here Revan's part
  


  // **************************Neha's part****************************
  const handleDeleteReply = async (postId, replyId, replyOwnerEmail) => {
    if (user?.email !== replyOwnerEmail) {
      alert("You can only delete your own replies.");
      return;
    }
  
    try {
      const postRef = doc(db, "discussion", postId);
      const replyRef = doc(postRef, "replies", replyId);
      await deleteDoc(replyRef);
  
      fetchReplies(postId); // ✅ Refresh replies after deletion
    } catch (error) {
      console.error("❌ Error deleting reply:", error);
      alert("Failed to delete reply.");
    }
  }; // ********************************* Till here Neha's part ***************************
  
  // Revan's part
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="discussion-page">
      <Header />
      <div className="discussion-container">
        <aside className="discussion-sidebar">
          <h4>Discussion Forum</h4>
          <Link to="/posts">Posts</Link>
          <Link to="/discussionforum">Discussion</Link>
          <Link to="/wildlife">Wildlife Encyclopedia</Link>
          <Link to="/library">Account</Link>
        </aside>

        <main className="discussion-content">
          <h2>Welcome to the Discussion Forum</h2>

          {/* ✅ Displaying Discussion Posts */}
          <section className="discussion-posts-section">
            <h3>Recent Discussions</h3>
            {posts.length === 0 ? (
              <p>No discussions available yet.</p>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="discussion-post-card">
                  <div className="discussion-post-header">
                    <h4>{post.title}</h4> {/* Till here Revan's part*/}

                    {/* ************************* Neha's part - Delete button alone **************** */}
                    {user?.email === post.userEmail && (
                      <button 
                        className="discussion-delete-button"
                        onClick={() => handleDeletePost(post.id, post.userEmail)}
                      >
                        ❌
                      </button> // ******************Till here Neha's part *********************
                    )}
                  </div>
                  <p>{post.content}</p>
                  <p><strong>Posted by:</strong> {post.createdBy}</p>


                    {/* ***************************** Neha's part for displaying the downloadable link ****************/}
                  {post.fileData && post.fileType && post.fileName && (
                    <a href={post.fileData} download={post.fileName} target="_blank" rel="noopener noreferrer">
                      📂 {post.fileName}
                    </a>
                  )} {/* TIll Here Neha's part************** */}



                  {/* ✅ Reply Section - Revan's part */}
                  <button onClick={() => {
                    if (expandedPostId === post.id) {
                      setExpandedPostId(null); // Close the replies section if it's already open
                    } else {
                      setExpandedPostId(post.id);
                      fetchReplies(post.id); // Fetch replies if opening
                    }
                  }}>
                    {expandedPostId === post.id ? "⬆️ Hide Replies" : "💬 View Replies"}
                  </button>

                  {expandedPostId === post.id && (
                    <div className="discussion-replies-section">
                      <h4>Replies</h4>
                      <textarea
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <button onClick={() => handleReplySubmit(post.id)}>Reply</button>

                      {/* ✅ Display Replies */}
                      {replies[post.id]?.length > 0 ? (
                        replies[post.id].map((reply) => (
                          <div key={reply.id} className="discussion-reply">
                            <p>{reply.content}</p>
                            <p><strong>By:</strong> {reply.createdBy}</p> 
                            {/* TIll here Revan's Part */}

                            {/* ✅ Show Delete Button if the Reply Belongs to the User -***************** Neha's part ********************/}
                            {user?.email === reply.userEmail && (
                              <button
                                className="reply-delete-button"
                                onClick={() => handleDeleteReply(post.id, reply.id, reply.userEmail)}
                              >
                                ❌ Delete
                              </button>
                            )} {/* ***************************Till here Neha's part ******************************* */}
                          </div>
                        ))// Revan's part from here 
                      ) : (
                        <p>No replies yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </section>

          {/* ✅ Discussion Post Submission */}
          {user ? (
            <section className="discussion-conversation-box">
              <h3>Start a Discussion</h3>
              <form onSubmit={handlePostSubmit}>
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <textarea placeholder="Write your post..." value={content} onChange={(e) => setContent(e.target.value)}></textarea>
                <input type="file" accept="image/*, video/*" onChange={handleFileChange} />
                <button type="submit">Post</button>
              </form>
            </section>
          ) : (
            <p className="discussion-error-message">🔒 You must be logged in to post.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default DiscussionForum; // Till here Revan's part
