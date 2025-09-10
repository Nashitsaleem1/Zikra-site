// Quran Audio Player - Full Implementation

class QuranAudioPlayer {
  constructor() {
    this.currentPara = 1;
    this.isPlaying = false;
    this.isLooping = false;
    this.currentTime = 0;
    this.duration = 0;
    this.volume = 0.8;
    this.playbackRate = 1;
    this.recentlyPlayed = this.loadRecentlyPlayed();

    this.initializeElements();
    this.initializeAudio();
    this.generateParaList();
    this.loadRecentList();
    this.bindEvents();
    this.updatePlayerInfo();
  }

  initializeElements() {
    // Audio controls
    this.audioElement = document.querySelector(".audio-element");
    this.playPauseBtn = document.querySelector(".play-pause-btn");
    this.prevBtn = document.querySelector(".prev-btn");
    this.nextBtn = document.querySelector(".next-btn");
    this.progressBar = document.querySelector(".progress-bar");
    this.progressFill = document.querySelector(".progress-fill");
    this.progressHandle = document.querySelector(".progress-handle");
    this.currentTimeEl = document.querySelector(".current-time");
    this.durationEl = document.querySelector(".duration");
    this.volumeSlider = document.querySelector(".volume-slider");
    this.speedSelect = document.querySelector(".speed-select");
    this.downloadBtn = document.querySelector(".download-btn");
    this.loopBtn = document.querySelector(".loop-btn");

    // Player info
    this.paraTitle = document.querySelector(".current-para-title");
    this.paraSubtitle = document.querySelector(".current-para-subtitle");

    // Para list
    this.paraGrid = document.querySelector(".para-grid");
    this.recentList = document.querySelector(".recent-list");

    // Loading indicator
    this.loadingIndicator = document.querySelector(".loading-indicator");
  }

  initializeAudio() {
    this.audioElement.volume = this.volume;
    this.volumeSlider.value = this.volume * 100;
    this.speedSelect.value = this.playbackRate;
  }

  generateParaList() {
    // Para information with English names and English descriptions
    const paraInfo = [
      {
        number: 1,
        title: "الفاتحة",
        subtitle: "From Surah Al-Fatiha to Surah Al-Baqarah verse 141",
      },
      {
        number: 2,
        title: "السفهاء",
        subtitle: "From Surah Al-Baqarah verse 142 to verse 252",
      },
      {
        number: 3,
        title: "تلك الرسل",
        subtitle:
          "From Surah Al-Baqarah verse 253 to Surah Aal-E-Imran verse 92",
      },
      {
        number: 4,
        title: "لن تنالوا",
        subtitle: "From Surah Aal-E-Imran verse 93 to verse 200",
      },
      {
        number: 5,
        title: "والمحصنات",
        subtitle: "From Surah An-Nisa verse 1 to verse 87",
      },
      {
        number: 6,
        title: "لا يحب الله",
        subtitle: "From Surah An-Nisa verse 88 to verse 147",
      },
      {
        number: 7,
        title: "وإذا سمعوا",
        subtitle: "From Surah An-Nisa verse 148 to Surah Al-Maida verse 81",
      },
      {
        number: 8,
        title: "ولو أننا",
        subtitle: "From Surah Al-Maida verse 82 to Surah Al-Anam verse 110",
      },
      {
        number: 9,
        title: "قال الملو",
        subtitle: "From Surah Al-Anam verse 111 to Surah Al-Araf verse 87",
      },
      {
        number: 10,
        title: "واعلموا",
        subtitle: "From Surah Al-Araf verse 88 to Surah Al-Anfal verse 40",
      },
      {
        number: 11,
        title: "يتزبرون",
        subtitle: "From Surah Al-Anfal verse 41 to Surah At-Tawbah verse 92",
      },
      {
        number: 12,
        title: "وما من دابة",
        subtitle: "From Surah At-Tawbah verse 93 to Surah Hud verse 5",
      },
      {
        number: 13,
        title: "وما أبرّيو",
        subtitle: "From Surah Hud verse 6 to Surah Yusuf verse 52",
      },
      {
        number: 14,
        title: "ربما",
        subtitle: "From Surah Yusuf verse 53 to Surah Ibrahim verse 52",
      },
      {
        number: 15,
        title: "سبحان الذي",
        subtitle: "From Surah Al-Hijr verse 1 to Surah An-Nahl verse 128",
      },
      {
        number: 16,
        title: "قال ألم",
        subtitle: "From Surah Al-Isra verse 1 to Surah Al-Kahf verse 74",
      },
      {
        number: 17,
        title: "اقترب للناس",
        subtitle: "From Surah Al-Kahf verse 75 to Surah Taha verse 135",
      },
      {
        number: 18,
        title: "قد أفلح",
        subtitle: "From Surah Al-Anbiya verse 1 to Surah Al-Hajj verse 78",
      },
      {
        number: 19,
        title: "وقال الذين",
        subtitle: "From Surah Al-Muminun verse 1 to Surah Al-Furqan verse 20",
      },
      {
        number: 20,
        title: "أمن خلق",
        subtitle: "From Surah Al-Furqan verse 21 to Surah An-Naml verse 55",
      },
      {
        number: 21,
        title: "اتلو ما أوحي",
        subtitle: "From Surah An-Naml verse 56 to Surah Al-Ankabut verse 45",
      },
      {
        number: 22,
        title: "ومن يقنت",
        subtitle: "From Surah Al-Ankabut verse 46 to Surah Al-Ahzab verse 30",
      },
      {
        number: 23,
        title: "ومالي",
        subtitle: "From Surah Al-Ahzab verse 31 to Surah Yasin verse 27",
      },
      {
        number: 24,
        title: "فمن ظلم",
        subtitle: "From Surah Yasin verse 28 to Surah Az-Zumar verse 31",
      },
      {
        number: 25,
        title: "إليه يرد",
        subtitle: "From Surah Az-Zumar verse 32 to Surah Fussilat verse 46",
      },
      {
        number: 26,
        title: "حم",
        subtitle: "From Surah Al-Ahqaf verse 1 to Surah Adh-Dhariyat verse 30",
      },
      {
        number: 27,
        title: "قال فما خطبكم",
        subtitle: "From Surah Adh-Dhariyat verse 31 to Surah Al-Hadid verse 29",
      },
      {
        number: 28,
        title: "قد سمع الله",
        subtitle: "From Surah Al-Mujadila verse 1 to Surah At-Tahrim verse 12",
      },
      {
        number: 29,
        title: "تبارك الذي",
        subtitle: "From Surah Al-Mulk verse 1 to Surah Al-Mursalat verse 50",
      },
      {
        number: 30,
        title: "أما يتساءلون",
        subtitle: "From Surah An-Naba to Surah An-Nas",
      },
    ];
    this.paraGrid.innerHTML = "";

    paraInfo.forEach((para, index) => {
      const paraItem = document.createElement("div");
      paraItem.className = "para-item";
      paraItem.dataset.para = para.number;

      // Add duration placeholder (you can update with actual durations)
      const duration = "45:30"; // Placeholder duration

      paraItem.innerHTML = `
                <div class="para-duration">${duration}</div>
                <div class="para-number">Juz ${para.number}</div>
                <div class="para-title">${para.title}</div>
                <div class="para-subtitle">${para.subtitle}</div>
            `;

      paraItem.addEventListener("click", () => {
        this.selectPara(para.number);
      });

      this.paraGrid.appendChild(paraItem);
    });

    this.updateParaSelection();
  }

  toArabicNumerals(number) {
    // Using English numerals instead of Arabic
    return number.toString();
  }

  bindEvents() {
    // Play/Pause button
    this.playPauseBtn.addEventListener("click", () => {
      this.togglePlayPause();
    });

    // Previous/Next buttons
    this.prevBtn.addEventListener("click", () => {
      this.previousPara();
    });

    this.nextBtn.addEventListener("click", () => {
      this.nextPara();
    });

    // Progress bar
    this.progressBar.addEventListener("click", (e) => {
      this.seekTo(e);
    });

    // Volume control
    this.volumeSlider.addEventListener("input", (e) => {
      this.setVolume(e.target.value / 100);
    });

    // Speed control
    this.speedSelect.addEventListener("change", (e) => {
      this.setPlaybackRate(parseFloat(e.target.value));
    });

    // Loop button
    this.loopBtn.addEventListener("click", () => {
      this.toggleLoop();
    });

    // Download button
    this.downloadBtn.addEventListener("click", () => {
      this.downloadCurrentPara();
    });

    // Audio events
    this.audioElement.addEventListener("loadstart", () => {
      this.showLoading();
    });

    this.audioElement.addEventListener("loadedmetadata", () => {
      this.duration = this.audioElement.duration;
      this.updateDuration();
      this.hideLoading();
    });

    this.audioElement.addEventListener("timeupdate", () => {
      this.updateProgress();
    });

    this.audioElement.addEventListener("ended", () => {
      this.onTrackEnded();
    });

    this.audioElement.addEventListener("error", (e) => {
      this.handleAudioError(e);
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
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

  selectPara(paraNumber) {
    if (paraNumber === this.currentPara) {
      this.togglePlayPause();
      return;
    }

    this.currentPara = paraNumber;
    this.loadPara();
    this.updatePlayerInfo();
    this.updateParaSelection();
    this.addToRecentlyPlayed();
  }

  loadPara() {
    // Try different possible file naming patterns
    const possiblePaths = [
      `../audios/full-quran/para-${this.currentPara}.mp3`,
      `../audios/full-quran/Juz ${this.currentPara}.mp3`,
      `../audios/full-quran/juz-${this.currentPara}.mp3`,
      `../audios/full-quran/juz${this.currentPara}.mp3`,
    ];

    // Use the first path by default
    let audioSrc = possiblePaths[0];

    // Clear previous error handlers to avoid stacking
    this.audioElement.onerror = null;

    // Set up new error handler
    this.audioElement.onerror = () => {
      // Get the current src index
      const currentIndex = possiblePaths.indexOf(this.audioElement.src);

      // If there are more paths to try
      if (currentIndex < possiblePaths.length - 1 && currentIndex !== -1) {
        console.log(
          `File not found at ${this.audioElement.src}, trying alternative path...`
        );
        // Try the next path
        this.audioElement.src = possiblePaths[currentIndex + 1];
      } else {
        console.error("Could not find audio file for Juz", this.currentPara);
        this.handleAudioError(
          new Error(`Audio file for Juz ${this.currentPara} not found`)
        );
        this.hideLoading();
      }
    };

    // Show loading indicator
    this.showLoading();

    // Set the source and reset playback
    this.audioElement.src = audioSrc;
    this.currentTime = 0;
    this.updateProgress();
  }

  updatePlayerInfo() {
    const paraInfo = this.getParaInfo(this.currentPara);
    this.paraTitle.textContent = `Juz ${this.currentPara} - ${paraInfo.title}`;
    this.paraSubtitle.textContent = paraInfo.subtitle;
  }

  getParaInfo(paraNumber) {
    const paraData = {
      1: {
        title: "Al-Fatiha",
        subtitle: "From Surah Al-Fatiha to Surah Al-Baqarah verse 141",
      },
      2: {
        title: "Sayaqul-Sufaha",
        subtitle: "From Surah Al-Baqarah verse 142 to verse 252",
      },
      // Add more para info as needed
    };

    return (
      paraData[paraNumber] || {
        title: `Juz ${paraNumber}`,
        subtitle: "Juz description",
      }
    );
  }

  updateParaSelection() {
    document.querySelectorAll(".para-item").forEach((item) => {
      item.classList.remove("active", "playing");
      if (parseInt(item.dataset.para) === this.currentPara) {
        item.classList.add("active");
        if (this.isPlaying) {
          item.classList.add("playing");
        }
      }
    });
  }

  togglePlayPause() {
    if (this.audioElement.src === "") {
      this.loadPara();
    }

    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audioElement
      .play()
      .then(() => {
        this.isPlaying = true;
        this.updatePlayButton();
        this.updateParaSelection();
      })
      .catch((error) => {
        console.error("Play error:", error);
        this.handleAudioError(error);
      });
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
    this.updatePlayButton();
    this.updateParaSelection();
  }

  updatePlayButton() {
    const icon = this.playPauseBtn.querySelector("i");
    icon.className = this.isPlaying ? "fas fa-pause" : "fas fa-play";
    this.playPauseBtn.title = this.isPlaying ? "Pause" : "Play";
  }

  previousPara() {
    if (this.currentPara > 1) {
      this.selectPara(this.currentPara - 1);
    }
  }

  nextPara() {
    if (this.currentPara < 30) {
      this.selectPara(this.currentPara + 1);
    }
  }

  seekTo(event) {
    const rect = this.progressBar.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const seekTime = percent * this.duration;
    this.audioElement.currentTime = seekTime;
  }

  updateProgress() {
    if (this.duration > 0) {
      const percent = (this.audioElement.currentTime / this.duration) * 100;
      this.progressFill.style.width = `${percent}%`;
      this.progressHandle.style.left = `${percent}%`;
      this.currentTime = this.audioElement.currentTime;
      this.updateTimeDisplay();
    }
  }

  updateTimeDisplay() {
    this.currentTimeEl.textContent = this.formatTime(this.currentTime);
    this.durationEl.textContent = this.formatTime(this.duration);
  }

  updateDuration() {
    this.durationEl.textContent = this.formatTime(this.duration);
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  setVolume(volume) {
    this.volume = volume;
    this.audioElement.volume = volume;
    this.saveSettings();
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    this.audioElement.playbackRate = rate;
    this.saveSettings();
  }

  toggleLoop() {
    this.isLooping = !this.isLooping;
    this.loopBtn.classList.toggle("active", this.isLooping);
    this.audioElement.loop = this.isLooping;
  }

  downloadCurrentPara() {
    const link = document.createElement("a");
    link.href = this.audioElement.src;
    link.download = `para-${this.currentPara}.mp3`;
    link.click();
  }

  onTrackEnded() {
    this.isPlaying = false;
    this.updatePlayButton();
    this.updateParaSelection();

    // Disable auto-play of next track
    // We no longer automatically go to the next para when one finishes
    if (this.isLooping) {
      // Only replay the same track if loop is enabled
      setTimeout(() => {
        this.play();
      }, 1000);
    }
  }

  handleAudioError(error) {
    console.error("Audio error:", error);
    this.hideLoading();

    // Stop playback if there's an error
    this.isPlaying = false;
    this.updatePlayButton();

    // Show a user-friendly error message
    this.showError(
      `Error loading audio file: ${
        error.message || "Unknown error"
      }. Please try a different Juz or check your connection.`
    );

    // Add a visible indication on the UI that there was a problem
    const paraItem = document.querySelector(
      `.para-item[data-para="${this.currentPara}"]`
    );
    if (paraItem) {
      paraItem.classList.add("error");
      paraItem.title = "Error loading this audio file";
    }
  }

  showError(message) {
    // Create an error notification
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-notification";
    errorDiv.innerHTML = `
            <div class="error-icon"><i class="fas fa-exclamation-circle"></i></div>
            <div class="error-message">${message}</div>
            <button class="error-close"><i class="fas fa-times"></i></button>
        `;

    // Style the error notification
    Object.assign(errorDiv.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      backgroundColor: "#f8d7da",
      color: "#721c24",
      border: "1px solid #f5c6cb",
      borderRadius: "4px",
      padding: "15px",
      display: "flex",
      alignItems: "center",
      maxWidth: "80%",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      zIndex: "9999",
      animation: "slideIn 0.3s ease-out",
    });

    // Add styles for the icon
    const iconDiv = errorDiv.querySelector(".error-icon");
    Object.assign(iconDiv.style, {
      marginRight: "10px",
      fontSize: "24px",
      color: "#dc3545",
    });

    // Add styles for the message
    const messageDiv = errorDiv.querySelector(".error-message");
    Object.assign(messageDiv.style, {
      flex: "1",
    });

    // Add styles for the close button
    const closeBtn = errorDiv.querySelector(".error-close");
    Object.assign(closeBtn.style, {
      background: "none",
      border: "none",
      color: "#721c24",
      cursor: "pointer",
      fontSize: "16px",
      marginLeft: "10px",
    });

    // Add the error to the DOM
    document.body.appendChild(errorDiv);

    // Add animation keyframes
    const style = document.createElement("style");
    style.innerHTML = `
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `;
    document.head.appendChild(style);

    // Handle close button
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(errorDiv);
    });

    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
      }
    }, 8000);
  }

  showLoading() {
    this.loadingIndicator.classList.add("show");
  }

  hideLoading() {
    this.loadingIndicator.classList.remove("show");
  }

  handleKeyboardShortcuts(event) {
    // Prevent shortcuts when typing in inputs
    if (event.target.tagName === "INPUT" || event.target.tagName === "SELECT") {
      return;
    }

    switch (event.code) {
      case "Space":
        event.preventDefault();
        this.togglePlayPause();
        break;
      case "ArrowLeft":
        event.preventDefault();
        this.previousPara();
        break;
      case "ArrowRight":
        event.preventDefault();
        this.nextPara();
        break;
      case "ArrowUp":
        event.preventDefault();
        this.setVolume(Math.min(1, this.volume + 0.1));
        this.volumeSlider.value = this.volume * 100;
        break;
      case "ArrowDown":
        event.preventDefault();
        this.setVolume(Math.max(0, this.volume - 0.1));
        this.volumeSlider.value = this.volume * 100;
        break;
    }
  }

  addToRecentlyPlayed() {
    const paraInfo = this.getParaInfo(this.currentPara);
    const recentItem = {
      para: this.currentPara,
      title: `Juz ${this.currentPara} - ${paraInfo.title}`,
      subtitle: paraInfo.subtitle,
      timestamp: Date.now(),
      progress: 0,
    };

    // Remove if already exists
    this.recentlyPlayed = this.recentlyPlayed.filter(
      (item) => item.para !== this.currentPara
    );

    // Add to beginning
    this.recentlyPlayed.unshift(recentItem);

    // Keep only last 5 items
    this.recentlyPlayed = this.recentlyPlayed.slice(0, 5);

    this.saveRecentlyPlayed();
    this.loadRecentList();
  }

  loadRecentList() {
    this.recentList.innerHTML = "";

    if (this.recentlyPlayed.length === 0) {
      this.recentList.innerHTML =
        '<p style="color: #999; text-align: center; width: 100%;">No recent items</p>';
      return;
    }

    this.recentlyPlayed.forEach((item) => {
      const recentItem = document.createElement("div");
      recentItem.className = "recent-item";
      recentItem.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.subtitle}</p>
                <div class="recent-progress">
                    <div class="recent-progress-fill" style="width: ${item.progress}%"></div>
                </div>
            `;

      recentItem.addEventListener("click", () => {
        this.selectPara(item.para);
      });

      this.recentList.appendChild(recentItem);
    });
  }

  saveRecentlyPlayed() {
    localStorage.setItem(
      "zikra-recent-quran",
      JSON.stringify(this.recentlyPlayed)
    );
  }

  loadRecentlyPlayed() {
    const saved = localStorage.getItem("zikra-recent-quran");
    return saved ? JSON.parse(saved) : [];
  }

  saveSettings() {
    const settings = {
      volume: this.volume,
      playbackRate: this.playbackRate,
      isLooping: this.isLooping,
    };
    localStorage.setItem("zikra-audio-settings", JSON.stringify(settings));
  }

  loadSettings() {
    const saved = localStorage.getItem("zikra-audio-settings");
    if (saved) {
      const settings = JSON.parse(saved);
      this.volume = settings.volume || 0.8;
      this.playbackRate = settings.playbackRate || 1;
      this.isLooping = settings.isLooping || false;
    }
  }
}

// Initialize the player when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const player = new QuranAudioPlayer();

  // Make player globally accessible for debugging
  window.quranPlayer = player;
});

// Service worker registration for offline support (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
