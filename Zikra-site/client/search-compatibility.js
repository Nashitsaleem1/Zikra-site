/**
 * Zikra Search - Compatibility Script
 *
 * This script provides compatibility between the different search implementations
 * and ensures proper handling of surah name variations like 'kahaf'/'kahf'
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Zikra Search Compatibility Script loaded");

  // Get search elements
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchResults = document.getElementById("search-results");

  if (!searchInput || !searchButton || !searchResults) {
    console.warn("Search elements not found");
    return;
  }

  // Surah name variations mapping
  const surahAliases = {
    kahf: ["kahaf", "cave", "al-kahf"],
    mulk: ["al-mulk", "kingdom"],
    fatiha: ["fatihah", "opening", "al-fatiha"],
    baqarah: ["baqara", "cow", "al-baqarah"],
    imran: ["al-imran", "family of imran"],
    nisa: ["al-nisa", "women"],
    yasin: ["ya-sin", "yaseen"],
  };

  // Search function
  function performSearch() {
    const query = searchInput.value.trim();
    if (query.length < 2) return;

    console.log(`Performing search for: ${query}`);

    // Show loading state
    searchResults.innerHTML = '<div class="loading">Searching...</div>';

    // Enhance query
    const enhancedQuery = enhanceSearchQuery(query);
    console.log(`Enhanced query: ${enhancedQuery}`);

    // Search in CSV
    searchInCSV(enhancedQuery, (results) => {
      displaySearchResults(results);
    });
  }

  // Enhance search query with aliases
  function enhanceSearchQuery(query) {
    // Special handling for "kahaf" search
    if (query.toLowerCase() === "kahaf") {
      console.log('Special handling for "kahaf" search');
      return "kahf al-kahf kahaf surah kahf surah al-kahf";
    }

    let enhancedTerms = [query.toLowerCase()];
    const words = query.toLowerCase().split(/\s+/);

    words.forEach((word) => {
      // Check for surah name variations
      Object.entries(surahAliases).forEach(([key, aliases]) => {
        if (word === key || aliases.includes(word)) {
          // Add all variations of this surah name
          enhancedTerms.push(key);
          enhancedTerms = enhancedTerms.concat(aliases);
        }
      });

      // Special case for prefix removal
      const prefixes = ["surah", "sura", "al-", "an-", "at-", "ar-", "az-"];
      for (const prefix of prefixes) {
        if (word.startsWith(prefix)) {
          const base = word.substring(prefix.length);
          if (base.length > 1) {
            enhancedTerms.push(base);
          }
        }
      }
    });

    return [...new Set(enhancedTerms)].join(" ");
  }

  // Search in CSV data
  // Define fallback function
  function searchInCSVLocal(query, callback) {
    console.log("Searching in CSV with query:", query);

    fetch("./Assets/data/youtube_videos_complete.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.split("\n").filter((line) => line.trim());
        const headers = parseCSVLine(lines[0]);
        const videos = lines.slice(1).map((line) => {
          const values = parseCSVLine(line);
          const video = {};
          headers.forEach((header, index) => {
            video[header] = values[index] || "";
          });
          return video;
        });

        const terms = query.toLowerCase().split(/\s+/);
        const results = videos.filter((video) =>
          terms.some(
            (term) =>
              (video.title && video.title.toLowerCase().includes(term)) ||
              (video.description &&
                video.description.toLowerCase().includes(term)) ||
              (video.tags && video.tags.toLowerCase().includes(term))
          )
        );

        callback(results);
      })
      .catch((error) => {
        console.error("Error loading CSV:", error);
        callback([]);
      });
  }

  // Wrapper
  function searchInCSV(query, callback) {
    if (typeof window.originalSearchInCSV === "function") {
      window.originalSearchInCSV(query, callback);
    } else {
      searchInCSVLocal(query, callback);
    }
  }

  // Parse CSV line
  function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  // Display search results
  function displaySearchResults(results) {
    console.log(`Displaying ${results.length} results`);

    if (results.length === 0) {
      searchResults.innerHTML =
        '<div class="no-results">No results found. Try different keywords.</div>';
      return;
    }

    const html = results
      .map(
        (video, index) => `
            <div class="result-item">
                <div class="result-thumbnail">
                    <a href="https://www.youtube.com/watch?v=${
                      video.video_id
                    }" target="_blank">
                        <img src="${
                          video.thumbnail_url ||
                          `https://i.ytimg.com/vi/${video.video_id}/mqdefault.jpg`
                        }" alt="${video.title}">
                    </a>
                </div>
                <div class="result-content">
                    <h3><a href="https://www.youtube.com/watch?v=${
                      video.video_id
                    }" target="_blank">${video.title}</a></h3>
                    <p class="result-description">${(
                      video.description || ""
                    ).substring(0, 150)}${
          (video.description || "").length > 150 ? "..." : ""
        }</p>
                    <div class="result-meta">
                        <span class="result-date">Published: ${new Date(
                          video.published_at
                        ).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `
      )
      .join("");

    searchResults.innerHTML = html;
  }

  // Bind events
  searchButton.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  // Make functions available globally
  window.enhanceSearchQuery = enhanceSearchQuery;
  window.originalSearchInCSV = window.searchInCSV; // preserve any existing
  window.searchInCSV = searchInCSV;
  window.displaySearchResults = displaySearchResults;
  window.performSearch = performSearch;

  console.log("Search compatibility script initialized");
});
