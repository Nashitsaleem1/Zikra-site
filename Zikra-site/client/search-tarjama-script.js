//  Helper: Similarity function
function similarity(a, b) {
  if (!a || !b) return 0;
  let matches = 0;
  const minLength = Math.min(a.length, b.length);
  for (let i = 0; i < minLength; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

// Search Engine Class
class CSVSearchEngine {
  constructor(videos) {
    this.allVideos = videos || [];
    this.filteredVideos = [];
    this.surahAliases = {
      kahf: ["kahaf", "cave"],
      kahaf: ["kahf", "cave"],
      "ya-sin": ["yasin", "yaseen"],
      fatiha: ["fatihah", "fateha", "opening"],
      baqarah: ["baqara", "cow"],
      imran: ["al-imran"],
      nisa: ["an-nisa", "women"],
      maidah: ["al-maidah", "table"],
      anam: ["al-anam", "cattle"],
      araf: ["al-araf", "heights"],
      anfal: ["al-anfal"],
      tawbah: ["at-tawbah", "repentance"],
      yunus: ["jonah"],
      hud: ["hood"],
      yusuf: ["joseph"],
      rad: ["thunder"],
      ibrahim: ["abraham"],
      hijr: ["al-hijr"],
      nahl: ["an-nahl", "bee"],
      isra: ["al-isra"],
      mulk: ["al-mulk", "kingdom"],
      qalam: ["al-qalam", "pen"],
      haqqah: ["al-haqqah"],
      nuh: ["noah"],
      jinn: ["al-jinn"],
      muzammil: ["al-muzammil"],
      mudassir: ["al-mudassir"],
      qiyamah: ["al-qiyamah"],
      dahr: ["ad-dahr"],
      mursalat: ["al-mursalat"],
      naba: ["an-naba"],
      naziat: ["an-naziat"],
      abasa: ["he frowned"],
      takwir: ["at-takwir"],
      buruj: ["al-buruj"],
      tariq: ["at-tariq"],
      ala: ["al-ala", "most high"],
      gashiyah: ["al-gashiyah"],
      fajr: ["al-fajr"],
      balad: ["al-balad"],
      shams: ["ash-shams"],
      layl: ["al-layl"],
      duha: ["ad-duha"],
      sharh: ["ash-sharh"],
      tin: ["at-tin"],
      alaq: ["al-alaq"],
      qadr: ["al-qadr"],
      bayyinah: ["al-bayyinah"],
      zalzalah: ["az-zalzalah"],
      adiyat: ["al-adiyat"],
      qariah: ["al-qariah"],
      takathur: ["at-takathur"],
      asr: ["al-asr"],
      humazah: ["al-humazah"],
      fil: ["al-fil"],
      quraysh: ["quraish"],
      maun: ["al-maun"],
      kawthar: ["al-kawthar"],
      kafirun: ["al-kafirun"],
      nasr: ["an-nasr"],
      masad: ["al-masad"],
      ikhlas: ["al-ikhlas"],
      falaq: ["al-falaq"],
      nas: ["an-nas"],
    };
    this.removeShorts();
  }

  isShort(video) {
    const text = `${video.title || ""} ${video.description || ""} ${
      video.tags || ""
    }`.toLowerCase();
    const indicators = ["#shorts", "#short", "short video", "youtube shorts"];
    return indicators.some((i) => text.includes(i));
  }

  removeShorts() {
    this.filteredVideos = this.allVideos.filter(
      (video) => !this.isShort(video)
    );
  }

  normalizeTerm(term) {
    term = term.toLowerCase().trim();

    // Map common variations to standard names
    const specialMapping = {
      yasin: "ya-sin",
      yaseen: "ya-sin",
    };

    if (specialMapping[term]) return specialMapping[term];

    const prefixes = [
      "surah",
      "sura",
      "al-",
      "an-",
      "at-",
      "ar-",
      "as-",
      "ash-",
      "ad-",
    ];
    for (let prefix of prefixes) {
      if (term.startsWith(prefix)) return term.slice(prefix.length).trim();
    }
    return term;
  }

  expandSearchTerms(query) {
    const terms = [];
    query
      .toLowerCase()
      .split(/\s+/)
      .forEach((word) => {
        const norm = this.normalizeTerm(word);
        terms.push(norm);
        if (this.surahAliases[norm]) terms.push(...this.surahAliases[norm]);
      });
    return Array.from(new Set(terms.filter(Boolean)));
  }

  calculateScore(video, searchTerms) {
    let score = 0;
    const title = (video.title || "").toLowerCase();
    const description = (video.description || "").toLowerCase();
    const tags = (video.tags || "").toLowerCase();

    searchTerms.forEach((term) => {
      // Title matches
      if (title.includes(term)) {
        score += 10;
        if (
          title.startsWith(term) ||
          title.endsWith(term) ||
          title.split(" ").includes(term)
        ) {
          score += 5; // exact word bonus
        }
      }
      // Tags
      if (tags.includes(term)) score += 5;
      // Description
      if (description.includes(term)) score += 3;

      // Fuzzy matching (like Python's SequenceMatcher)
      title.split(/\s+/).forEach((word) => {
        const sim = similarity(term, word);
        if (sim > 0.8) score += Math.floor(sim * 3);
      });
    });

    return score;
  }

  search(query, maxResults = 20) {
    if (!query.trim()) return [];
    const searchTerms = this.expandSearchTerms(query);
    console.log("🔍 Searching for:", searchTerms);

    const scored = this.filteredVideos
      .map((video) => ({
        video,
        score: this.calculateScore(video, searchTerms),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.video);

    console.log(` Found ${scored.length} relevant videos`);
    return scored;
  }
}

class YouTubeSearchManager {
  constructor() {
    // YouTube API Configuration
    this.API_KEY = "AIzaSyCz1L7-mDUokwxh82ThbrRY3mzkdY5qeE0";
    this.CHANNEL_ID = "UCLYuowOAkMxiPFNWEDzqldQ";

    // Initialize properties
    this.currentQuery = "";
    this.currentFilters = {};
    this.searchResults = [];
    this.isLoading = false;
    this.isGridView = true;
    this.videos = [];
    this.csvPath = "./Assets/data/youtube_videos_complete.csv";
    this.initializeElements();
    this.populateFilters();
    this.bindEvents();
    this.loadCSVData();
  }

  async loadCSVData() {
    try {
      console.log("Loading CSV data...");
      const response = await fetch(this.csvPath);

      if (!response.ok) {
        throw new Error(
          `Failed to load CSV: ${response.status} ${response.statusText}`
        );
      }

      const csvText = await response.text();
      this.parseCSV(csvText);

      console.log(`Loaded ${this.videos.length} videos from CSV`);
    } catch (error) {
      console.error("Error loading CSV:", error);
      this.showError(
        "Failed to load video data. Please refresh the page and try again."
      );
    }
  }

  parseCSV(csvText) {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length) {
      console.error("PapaParse errors:", parsed.errors);
    }

    this.videos = parsed.data.map((row) => {
      return {
        video_id: row.video_id || "",
        title: row.title || "",
        description: "Tarjuma By : Molana Muhammad Saleem Akhtar",
        tags: row.tags || "",
        duration: row.duration || "",
        view_count: row.view_count || "",
        published_at: row.published_at || "",
      };
    });

    // this.saveToJSON(this.videos);
  }

  saveToJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a download link dynamically
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "videos.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  parseCSVLine(line) {
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

    // Push the last value
    result.push(current);

    return result;
  }

  initializeElements() {
    // Search elements
    this.searchInput = document.querySelector(".search-input");
    this.searchBtn = document.querySelector(".search-btn");
    this.clearSearchBtn = document.querySelector(".clear-search");
    this.suggestionsContainer = document.querySelector(".suggestions-list");

    // Add debug log for elements
    console.log("Search elements initialized:", {
      searchInput: !!this.searchInput,
      searchBtn: !!this.searchBtn,
      clearSearchBtn: !!this.clearSearchBtn,
      suggestionsContainer: !!this.suggestionsContainer,
    });

    // Filter elements
    this.surahFilter = document.getElementById("surah-filter");
    this.paraFilter = document.getElementById("para-filter");
    this.durationFilter = document.getElementById("duration-filter");
    this.sortFilter = document.getElementById("sort-filter");
    this.clearFiltersBtn = document.querySelector(".clear-filters");

    // Results elements
    this.resultsGrid = document.querySelector(".results-grid");
    this.resultsCount = document.querySelector(".results-count");
    this.gridViewBtn = document.querySelector(".grid-view");
    this.listViewBtn = document.querySelector(".list-view");
    this.loadMoreBtn = document.querySelector(".load-more-btn");

    // Modal elements
    this.videoModal = document.querySelector(".video-modal");
    this.modalTitle = document.querySelector(".modal-title");
    this.modalClose = document.querySelector(".modal-close");
    this.modalOverlay = document.querySelector(".modal-overlay");
    this.videoIframe = document.querySelector(".video-iframe");
    this.videoDescription = document.querySelector(
      ".video-info .video-description"
    );
    this.videoDuration = document.querySelector(".video-info .video-duration");
    this.videoViews = document.querySelector(".video-info .video-views");
    this.videoDate = document.querySelector(".video-info .video-date");
    this.watchOnYouTube = document.querySelector(".watch-on-youtube");

    // State elements
    this.loadingIndicator = document.querySelector(".loading-indicator");
    this.errorMessage = document.querySelector(".error-message");
    this.retryBtn = document.querySelector(".retry-btn");
  }

  populateFilters() {
    // Populate Surah filter
    const surahs = [
      "Al-Fatihah",
      "Al-Baqarah",
      "Al-Imran",
      "An-Nisa",
      "Al-Maidah",
      "Al-Anam",
      "Al-Araf",
      "Al-Anfal",
      "At-Tawbah",
      "Yunus",
      "Hud",
      "Yusuf",
      "Ar-Rad",
      "Ibrahim",
      "Al-Hijr",
      "An-Nahl",
      "Al-Isra",
      "Al-Kahf",
      "Maryam",
      "Ta-Ha",
      "Al-Anbiya",
      "Al-Hajj",
      "Al-Muminun",
      "An-Nur",
      "Al-Furqan",
      "Ash-Shuara",
      "An-Naml",
      "Al-Qasas",
      "Al-Ankabut",
      "Ar-Rum",
      "Luqman",
      "As-Sajdah",
      "Al-Ahzab",
      "Saba",
      "Fatir",
      "Ya-Sin",
      "As-Saffat",
      "Sad",
      "Az-Zumar",
      "Ghafir",
      "Fussilat",
      "Ash-Shura",
      "Az-Zukhruf",
      "Ad-Dukhan",
      "Al-Jathiya",
      "Al-Ahqaf",
      "Muhammad",
      "Al-Fath",
      "Al-Hujurat",
      "Qaf",
      "Adh-Dhariyat",
      "At-Tur",
      "An-Najm",
      "Al-Qamar",
      "Ar-Rahman",
      "Al-Waqia",
      "Al-Hadid",
      "Al-Mujadila",
      "Al-Hashr",
      "Al-Mumtahanah",
      "As-Saff",
      "Al-Jumuah",
      "Al-Munafiqun",
      "At-Taghabun",
      "At-Talaq",
      "At-Tahrim",
      "Al-Mulk",
      "Al-Qalam",
      "Al-Haqqah",
      "Al-Maarij",
      "Nuh",
      "Al-Jinn",
      "Al-Muzzammil",
      "Al-Muddathir",
      "Al-Qiyamah",
      "Al-Insan",
      "Al-Mursalat",
      "An-Naba",
      "An-Naziat",
      "Abasa",
      "At-Takwir",
      "Al-Infitar",
      "Al-Mutaffifin",
      "Al-Inshiqaq",
      "Al-Buruj",
      "At-Tariq",
      "Al-Ala",
      "Al-Ghashiyah",
      "Al-Fajr",
      "Al-Balad",
      "Ash-Shams",
      "Al-Layl",
      "Ad-Duha",
      "Ash-Sharh",
      "At-Tin",
      "Al-Alaq",
      "Al-Qadr",
      "Al-Bayyinah",
      "Az-Zalzalah",
      "Al-Adiyat",
      "Al-Qariah",
      "At-Takathur",
      "Al-Asr",
      "Al-Humazah",
      "Al-Fil",
      "Quraysh",
      "Al-Maun",
      "Al-Kawthar",
      "Al-Kafirun",
      "An-Nasr",
      "Al-Masad",
      "Al-Ikhlas",
      "Al-Falaq",
      "An-Nas",
    ];

    surahs.forEach((surah, index) => {
      const option = document.createElement("option");
      option.value = index + 1;
      option.textContent = `${index + 1}. ${surah}`;
      this.surahFilter.appendChild(option);
    });

    // Populate Para filter
    for (let i = 1; i <= 30; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Juz ${i}`;
      this.paraFilter.appendChild(option);
    }
  }

  bindEvents() {
    // Search events
    this.searchInput.addEventListener("input", (e) => {
      this.handleSearchInput(e.target.value);
    });

    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.performSearch();
      }
    });

    this.searchBtn.addEventListener("click", () => {
      this.performSearch();
    });

    this.clearSearchBtn.addEventListener("click", () => {
      this.clearSearch();
    });

    // Suggestion tags
    this.suggestionsContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("suggestion-tag")) {
        this.searchInput.value = e.target.textContent;
        this.performSearch();
      }
    });

    // Filter events
    [
      this.surahFilter,
      this.paraFilter,
      this.durationFilter,
      this.sortFilter,
    ].forEach((filter) => {
      filter.addEventListener("change", () => {
        this.updateFilters();

        // Update the search input to show the Surah or Para if selected
        if (filter === this.surahFilter && filter.value) {
          const selectedOption = filter.options[filter.selectedIndex];
          if (selectedOption) {
            this.searchInput.value = selectedOption.textContent.split(". ")[1];
          }
        } else if (filter === this.paraFilter && filter.value) {
          const selectedOption = filter.options[filter.selectedIndex];
          if (selectedOption) {
            this.searchInput.value = selectedOption.textContent;
          }
        }

        // Run the search with updated input + filters
        this.performSearch();
      });
    });

    this.clearFiltersBtn.addEventListener("click", () => {
      this.clearFilters();
    });

    // View toggle
    this.gridViewBtn.addEventListener("click", () => {
      this.setViewMode("grid");
    });

    this.listViewBtn.addEventListener("click", () => {
      this.setViewMode("list");
    });

    // Load more
    this.loadMoreBtn.addEventListener("click", () => {
      this.loadMoreResults();
    });

    // Modal events
    this.modalClose.addEventListener("click", () => {
      this.closeModal();
    });

    this.modalOverlay.addEventListener("click", () => {
      this.closeModal();
    });

    // Error retry
    this.retryBtn.addEventListener("click", () => {
      this.hideError(); // hide the error modal
      this.performSearch(); // re-run the search
    });
    // Mobile menu
    this.initMobileMenu();
  }

  initMobileMenu() {
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const nav = document.querySelector(".nav");

    if (mobileMenuBtn && nav) {
      mobileMenuBtn.addEventListener("click", () => {
        nav.classList.toggle("mobile-open");
      });
    }
  }

  handleSearchInput(value) {
    if (value.length > 0) {
      this.clearSearchBtn.classList.add("visible");
    } else {
      this.clearSearchBtn.classList.remove("visible");
    }

    // You can add live search suggestions here if needed
  }

  clearSearch() {
    this.searchInput.value = "";
    this.clearSearchBtn.classList.remove("visible");
    this.currentQuery = "";
    this.searchResults = [];
    this.resultsGrid.innerHTML = "";
    this.resultsCount.textContent = "Start searching to find videos";
  }

  updateFilters() {
    this.currentFilters = {
      surah: this.surahFilter.value,
      para: this.paraFilter.value,
      duration: this.durationFilter.value,
      sort: this.sortFilter.value,
    };
  }

  clearFilters() {
    this.surahFilter.value = "";
    this.paraFilter.value = "";
    this.durationFilter.value = "";
    this.sortFilter.value = "relevance";
    this.currentFilters = {};

    if (this.currentQuery) {
      this.performSearch();
    }
  }

  setViewMode(mode) {
    this.isGridView = mode === "grid";

    if (this.isGridView) {
      this.gridViewBtn.classList.add("active");
      this.listViewBtn.classList.remove("active");
      this.resultsGrid.classList.remove("list-view");
    } else {
      this.listViewBtn.classList.add("active");
      this.gridViewBtn.classList.remove("active");
      this.resultsGrid.classList.add("list-view");
    }
  }

  async performSearch(loadMore = false) {
    if (this.isLoading) return;

    const query = this.searchInput.value.trim();

    // ✅ Allow search even if query is empty but filters are set
    if (!query && !loadMore && Object.keys(this.currentFilters).length === 0) {
      this.showError("Please enter a search term or apply filters");
      return;
    }

    if (!loadMore) {
      this.currentQuery = query;
      this.searchResults = [];
    }

    this.showLoading();

    try {
      // Initialize search engine if not done
      if (!this.csvSearchEngine) {
        this.csvSearchEngine = new CSVSearchEngine(this.videos);
      }

      // ✅ Always search, even if query is empty
      let results = query
        ? this.csvSearchEngine.search(query, 200)
        : [...this.videos];

      // ✅ Always apply filters after search
      results = this.applyFilters(results);

      this.searchResults = results;
      this.renderResults();
      this.updateResultsCount();
      this.hideLoading();
    } catch (err) {
      console.error(err);
      this.hideLoading();
      this.showError("An error occurred during search");
    }
  }

  searchInCSV(query) {
    console.log("Searching in CSV with query:", query);

    const normalizedQuery = query.toLowerCase().trim();
    const queryTerms = normalizedQuery
      .split(/\s+/)
      .filter((term) => term.length > 0);
    console.log("Query terms:", queryTerms);

    if (!this.videos || this.videos.length === 0) {
      console.error("No videos available for search!");
      return [];
    }

    // Filter videos by query
    let results = this.videos.filter((video) => {
      const title = video.title || "";
      const description = video.description || "";
      const tags = video.tags || "";
      const searchText = `${title} ${description} ${tags}`.toLowerCase();

      if (queryTerms.length <= 2) {
        return queryTerms.every((term) => searchText.includes(term));
      } else {
        const matchCount = queryTerms.filter((term) =>
          searchText.includes(term)
        ).length;
        return matchCount >= Math.ceil(queryTerms.length * 0.5);
      }
    });

    // ✅ Debug a couple of sample videos after filtering
    console.log("Sample results preview:", results.slice(0, 2));

    results = this.applyFilters(results);

    if (this.currentFilters.sort === "date") {
      results.sort(
        (a, b) => new Date(b.published_at) - new Date(a.published_at)
      );
    } else if (this.currentFilters.sort === "views") {
      results.sort(
        (a, b) =>
          parseInt(b.view_count || 0, 10) - parseInt(a.view_count || 0, 10)
      );
    } else {
      results.sort((a, b) => {
        const aRelevance = this.calculateRelevance(a, queryTerms);
        const bRelevance = this.calculateRelevance(b, queryTerms);
        return bRelevance - aRelevance;
      });
    }

    return results;
  }

  calculateRelevance(video, queryTerms) {
    const searchText =
      `${video.title} ${video.description} ${video.tags}`.toLowerCase();
    let score = 0;

    // Count matches in the title (higher weight)
    queryTerms.forEach((term) => {
      if (video.title.toLowerCase().includes(term)) {
        score += 3;
      }

      // Count matches in description and tags
      if (searchText.includes(term)) {
        score += 1;
      }
    });

    // Bonus for exact phrase match in title
    const fullQuery = queryTerms.join(" ");
    if (video.title.toLowerCase().includes(fullQuery)) {
      score += 5;
    }

    return score;
  }

  applyFilters(videos) {
    let results = [...videos];

    // Filter by Surah
    if (this.currentFilters.surah) {
      const surahOption =
        this.surahFilter.options[this.surahFilter.selectedIndex];
      if (surahOption) {
        const surahName = surahOption.textContent.split(". ")[1].toLowerCase();
        results = results.filter((video) => {
          const videoText =
            `${video.title} ${video.description} ${video.tags}`.toLowerCase();
          return videoText.includes(surahName);
        });
      }
    }

    // Filter by Para/Juz
    if (this.currentFilters.para) {
      const paraOption = this.paraFilter.options[this.paraFilter.selectedIndex];
      if (paraOption) {
        const paraText = paraOption.textContent.toLowerCase();
        results = results.filter((video) => {
          const videoText =
            `${video.title} ${video.description} ${video.tags}`.toLowerCase();
          return (
            videoText.includes(paraText) ||
            videoText.includes(`${this.currentFilters.para}`)
          );
        });
      }
    }

    // // Filter by duration
    // if (this.currentFilters.duration) {
    //   results = results.filter((video) => {
    //     const durationInSeconds = this.parseDuration(video.duration);

    //     switch (this.currentFilters.duration) {
    //       case "short":
    //         return durationInSeconds < 240; // < 4 minutes
    //       case "medium":
    //         return durationInSeconds >= 240 && durationInSeconds < 1200; // 4-20 minutes
    //       case "long":
    //         return durationInSeconds >= 1200; // > 20 minutes
    //       default:
    //         return true;
    //     }
    //   });
    // }

    return results;
  }

  parseDuration(duration) {
    if (!duration) return 0;

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  enhanceSearchQuery(query) {
    // Special handling for "kahaf" search
    if (query.toLowerCase() === "kahaf") {
      console.log('Special handling for "kahaf" search');
      return "kahf al-kahf kahaf surah kahf surah al-kahf";
    }

    // Add common variations and synonyms for better search results
    const enhancements = {
      surah: "surah|chapter",
      para: "para|part|juz",
      ayah: "ayah|verse",
      tarjuma: "tarjuma|translation",
      tafseer: "tafseer|commentary",
      ruku: "ruku",
      nisf: "nisf|half",
      ruba: "ruba|quarter",
    };

    // Handle common surah name variations
    const surahVariations = {
      kahf: "kahf|al-kahf|kahaf",
      fatiha: "fatiha|al-fatiha",
      baqarah: "baqarah|al-baqarah",
      imran: "imran|al-imran",
      nisa: "nisa|al-nisa",
      mulk: "mulk|al-mulk",
      "ya-sin": "yasin|ya-sin|yaseen",
      kursi: "kursi|al-kursi",
    };

    let enhancedQuery = query;

    // Check if the query contains any surah name without the "Al-" prefix
    for (const [key, value] of Object.entries(surahVariations)) {
      if (query.toLowerCase().includes(key)) {
        enhancedQuery = query.replace(new RegExp(key, "i"), value);
        break;
      }
    }

    // Add channel-specific terms to improve relevance
    // Use a simpler enhancement to avoid over-filtering results
    if (
      !enhancedQuery.toLowerCase().includes("quran") &&
      !enhancedQuery.toLowerCase().includes("surah")
    ) {
      enhancedQuery += " Quran";
    }

    console.log("Search query:", query);
    console.log("Enhanced query:", enhancedQuery);

    return enhancedQuery;
  }

  renderResults() {
    this.resultsGrid.innerHTML = "";

    if (this.searchResults.length === 0) {
      this.resultsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>No results found</h3>
                    <p>Try using different keywords or adjusting your filters</p>
                </div>
            `;
      return;
    }

    this.searchResults.forEach((video) => {
      this.createVideoCard(video);
    });
  }

  appendResults(newResults) {
    newResults.forEach((video) => {
      this.createVideoCard(video);
    });
  }

  createVideoCard(video) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.videoId = video.video_id;
    console.log(video.duration);
    // Generate thumbnail URL from video ID
    const thumbnailUrl = `https://i.ytimg.com/vi/${video.video_id}/mqdefault.jpg`;
    const duration = this.formatDuration(video.duration || "PT0S");
    const viewCount = this.formatViewCount(video.view_count || "0");
    const publishDate = this.formatDate(video.published_at);

    card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbnailUrl}" alt="${video.title}" loading="lazy">
                <div class="video-duration">${duration}</div>
                <div class="play-overlay">
                    <i class="fas fa-play"></i>
                </div>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                <p class="video-description">${video.description || ""}</p>
                <div class="video-meta">
                    <span class="video-views">
                        <i class="fas fa-eye"></i>
                        ${viewCount}
                    </span>
                    <span class="video-date">
                        <i class="fas fa-calendar"></i>
                        ${publishDate}
                    </span>
                </div>
            </div>
        `;

    card.addEventListener("click", () => {
      this.openVideoModal(video);
    });

    this.resultsGrid.appendChild(card);
  }

  formatDuration(duration) {
    // Convert PT1H2M3S format to readable format
    console.log(duration);

    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) {
      // fallback for invalid or empty duration
      return "0:00";
    }

    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  formatViewCount(count) {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num.toString();
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    } else {
      return `${Math.floor(diffDays / 365)} years ago`;
    }
  }

  updateResultsCount() {
    const count = this.searchResults.length;
    if (count === 0) {
      this.resultsCount.textContent = "No results found";
    } else {
      this.resultsCount.textContent = `Found ${count} relevant videos`;
    }

    // Hide load more button since we're using CSV data
    this.loadMoreBtn.style.display = "none";
  }

  async loadMoreResults() {
    // This function is kept for compatibility but does nothing
    // since we're loading all results at once from CSV
    console.log("Load more not needed with CSV data");
  }

  openVideoModal(video) {
    const videoId = video.video_id;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

    this.modalTitle.textContent = video.title;
    this.videoIframe.src = embedUrl;
    this.videoDescription.textContent = video.description || "";
    console.log(video.view_count);

    this.videoDuration.textContent = `Duration: ${this.formatDuration(
      video.duration || "PT0S"
    )}`;
    this.videoViews.textContent = `Views: ${this.formatViewCount(
      video.view_count || "0"
    )}`;
    this.videoDate.textContent = `Published: ${this.formatDate(
      video.published_at
    )}`;
    this.watchOnYouTube.href = `https://www.youtube.com/watch?v=${videoId}`;

    this.videoModal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    this.videoModal.classList.remove("show");
    this.videoIframe.src = "";
    document.body.style.overflow = "";
  }

  showLoading() {
    this.isLoading = true;
    this.loadingIndicator.classList.add("show");
    this.loadMoreBtn.disabled = true;
  }

  hideLoading() {
    this.isLoading = false;
    this.loadingIndicator.classList.remove("show");
    this.loadMoreBtn.disabled = false;
  }

  showError(message) {
    // Set the error text
    this.errorMessage.querySelector(".error-text").textContent = message;

    // Make sure the error modal is visible
    this.errorMessage.classList.add("show");

    // Prevent background scroll
    document.body.style.overflow = "hidden";
  }

  hideError() {
    this.errorMessage.classList.remove("show");
    this.errorMessage.querySelector(".error-text").textContent = "";

    // Restore background scroll
    document.body.style.overflow = "";
  }

  showInitialVideos() {
    // Display some recent videos when the page first loads
    this.resultsCount.textContent = "Recent Videos";

    if (this.videos.length === 0) {
      this.resultsGrid.innerHTML = `
                  <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #999;">
                      <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem; display: block; color: #ffc107;"></i>
                      <h3>No Videos Found</h3>
                      <p>Please check if the YouTube videos CSV file is loaded correctly.</p>
                  </div>
              `;
      return;
    }

    // Sort by date (newest first) and take the first 12 videos
    const recentVideos = [...this.videos]
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
      .slice(0, 12);

    recentVideos.forEach((video) => {
      this.createVideoCard(video);
    });
  }

  showInitialSuggestions() {
    // Show popular/suggested searches initially
    this.resultsCount.textContent = "Start searching to find videos";

    // Display recent videos instead
    this.showInitialVideos();
  }
}

// Initialize the search manager when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const searchManager = new YouTubeSearchManager();

  // Make search manager globally accessible for debugging
  window.youtubeSearch = searchManager;

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl+K or Cmd+K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchManager.searchInput.focus();
    }

    // Escape to close modal
    if (
      e.key === "Escape" &&
      searchManager.videoModal.classList.contains("show")
    ) {
      searchManager.closeModal();
    }
  });
});

// Helper function to test API connection
window.testYouTubeAPI = async function () {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${window.youtubeSearch.CHANNEL_ID}&key=${window.youtubeSearch.API_KEY}`
    );
    const data = await response.json();

    if (response.ok && data.items && data.items.length > 0) {
      console.log("✅ YouTube API connection successful!");
      console.log("Channel:", data.items[0].snippet.title);
      return true;
    } else {
      console.error(
        "❌ YouTube API connection failed:",
        data.error || "Unknown error"
      );
      return false;
    }
  } catch (error) {
    console.error("❌ YouTube API connection error:", error);
    return false;
  }
};
