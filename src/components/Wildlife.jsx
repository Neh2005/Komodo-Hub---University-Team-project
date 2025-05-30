
/* **** Karmugilan's part **** */

import { useState } from "react";
import { Link } from "react-router-dom";
import { fetchWildlifeData } from "./fetchWildlifeData"; // Import API function
import Header from "./Header";
import "./Wildlife.css"; // Import CSS for styling

const Wildlife = () => {
  const [speciesName, setSpeciesName] = useState("");
  const [wildlifeData, setWildlifeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Handle Search and Fetch Data
  const handleSearch = async () => {
    if (!speciesName.trim()) {
      alert("Please enter a species name.");
      return;
    }

    setLoading(true);
    setError(null);
    const data = await fetchWildlifeData(speciesName);

    if (data) {
      setWildlifeData(data);
    } else {
      setWildlifeData(null);
      setError("No information found. Try another species.");
    }
    setLoading(false);
  };

  return (
    <div className="wildlife-page">
      <Header />
      <div className="wildlife-container">
        <aside className="wildlife-sidebar">
        <h4>Library Dashboard</h4>
          <Link to="/posts">Posts</Link>
          <Link to="/discussionforum">Discussion</Link>
          <Link to="/wildlife">Wildlife Encyclopedia</Link>
          <Link to="/library">Account</Link>
        </aside>

        <main className="wildlife-content">
          <h2>Search Wildlife Encyclopedia</h2>

          {/* ✅ Search Bar */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Enter species name..."
              value={speciesName}
              onChange={(e) => setSpeciesName(e.target.value)}
            />
            <button onClick={handleSearch}>🔍 Search</button>
          </div>

          {/* ✅ Loading Indicator */}
          {loading && <p>Loading...</p>}

          {/* ✅ Error Message */}
          {error && <p className="error">{error}</p>}

          {/* ✅ Display Wildlife Data */}
          {wildlifeData && (
            <div className="wildlife-info">
              <h3>{wildlifeData.name}</h3>
              <img src={wildlifeData.imageUrl} alt={wildlifeData.name} />
              <p><strong>Description:</strong> {wildlifeData.description}</p>
              <p><strong>Conservation Status:</strong> {wildlifeData.conservationStatus}</p>
              <p><strong>Kingdom:</strong> {wildlifeData.kingdom}</p>
              <p><strong>Phylum:</strong> {wildlifeData.phylum}</p>
              <p><strong>Class:</strong> {wildlifeData.class}</p>
              <p><strong>Order:</strong> {wildlifeData.order}</p>
              <p><strong>Family:</strong> {wildlifeData.family}</p>
              <p><strong>Genus:</strong> {wildlifeData.genus}</p>
              <a href={wildlifeData.source} target="_blank" rel="noopener noreferrer">🌍 View More on GBIF</a>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Wildlife;
