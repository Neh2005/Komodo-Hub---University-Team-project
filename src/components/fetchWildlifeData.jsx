{/* **************** Neha's part ************************** */}

export const fetchWildlifeData = async (speciesName) => {
  const API_URL = `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(speciesName)}`;
  const WIKI_API_URL = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(speciesName)}`;
  const API_KEY = "beKtlLyiEzSE0Nc1h6dP1g==xMmtKFS3mhPI1xLN"; // Replace with your actual API key

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "X-Api-Key": API_KEY, // API key required for authentication
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log("No data found for", speciesName);
      return null;
    }

    const animal = data[0]; // API returns an array, we pick the first result
    const wikiResponse = await fetch(WIKI_API_URL);
    let imageUrl = "https://via.placeholder.com/150"; // Default image

    if (wikiResponse.ok) {
      const wikiData = await wikiResponse.json();
      imageUrl = wikiData.thumbnail?.source || imageUrl;
    }

    return {
      name: animal.name || "Unknown",
      description: animal.characteristics?.most_distinctive_feature || "No description available", 
      imageUrl: imageUrl,
      conservationStatus: animal.characteristics?.biggest_threat || "Unknown",
      kingdom: animal.taxonomy?.kingdom || "Unknown",
      phylum: animal.taxonomy?.phylum || "Unknown",
      class: animal.taxonomy?.class || "Unknown",
      order: animal.taxonomy?.order || "Unknown",
      family: animal.taxonomy?.family || "Unknown",
      genus: animal.taxonomy?.genus || "Unknown",
      habitat: animal.characteristics?.habitat || "Unknown",
      diet: animal.characteristics?.diet || "Unknown",
      lifespan: animal.characteristics?.lifespan || "Unknown",
      weight: animal.characteristics?.weight || "Unknown",
      height: animal.characteristics?.height || "Unknown",
      source: `https://www.api-ninjas.com/api/animals?name=${encodeURIComponent(speciesName)}`, // API reference link
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};
