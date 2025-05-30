
// **** Maneesh's part ****

import { Link } from "react-router-dom";
import Header from "../components/Header";
import "./PublicPlatform.css"; // Import scoped CSS file
import Profile from "../pages/Profile";

const Library = () => {
  return (
    <div className="library-page">
      <Header /> {/* Keep header inside the wrapper */}
      <div className="library-container">
        <aside className="library-sidebar">
          <h4>Library Dashboard</h4>
          <Link to="/posts">Posts</Link>
          <Link to="/discussionforum">Discussion</Link>
          <Link to="/wildlife">Wildlife Encyclopaedia</Link>
          <Link to="/library">Account</Link>
        </aside>

        <main className="library-content">
          <h2>Welcome to the Library Dashboard</h2>
         
        
            <Profile />
          

        </main>
      </div>
    </div>
  );
};

export default Library;
