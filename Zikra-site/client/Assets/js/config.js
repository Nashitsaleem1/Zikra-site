/**
 * Zikra Video Search - Configuration
 * Central configuration for the Zikra Dar Ul Nashr video search system
 */

const CONFIG = {
    // YouTube API Configuration
    YOUTUBE_API_KEY: 'AIzaSyCz1L7-mDUokwxh82ThbrRY3mzkdY5qeE0',
    CHANNEL_ID: 'UCLYuowOAkMxiPFNWEDzqldQ',
    
    // Update Settings
    UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    UPDATE_URL: '/api/update-videos', // Your server endpoint
    
    // Search Settings
    MAX_SEARCH_RESULTS: 20,
    MIN_SEARCH_LENGTH: 2,
    
    // File Paths
    VIDEO_DATA_PATH: './Assets/data/video-data.json',
    CSV_BACKUP_PATH: './Assets/data/youtube_videos_complete.csv',
    
    // Display Settings
    RESULTS_PER_PAGE: 10,
    DESCRIPTION_SNIPPET_LENGTH: 150,
    
    // Advanced Settings
    ENABLE_FUZZY_SEARCH: true,
    FUZZY_MATCH_THRESHOLD: 0.8, // 0.0 to 1.0, higher = stricter
    CACHE_RESULTS: true,
    CACHE_EXPIRY: 30 * 60 * 1000, // 30 minutes
    
    // Debug Settings
    DEBUG: false
};
