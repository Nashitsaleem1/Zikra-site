/**
 * Zikra Video Search - Core Search Engine
 * Provides intelligent search functionality for Zikra Dar Ul Nashr YouTube videos
 */

class ZikraVideoSearch {
    constructor() {
        this.videos = [];
        this.filteredVideos = [];
        this.surahAliases = {
            'kahf': ['kahaf', 'cave', 'al-kahf'],
            'mulk': ['al-mulk', 'kingdom'],
            'fatiha': ['fatihah', 'opening', 'al-fatiha'],
            'baqarah': ['baqara', 'cow', 'al-baqarah'],
            'imran': ['al-imran', 'family of imran'],
            'nisa': ['al-nisa', 'women'],
            'maidah': ['al-maidah', 'table spread'],
            'anam': ['al-anam', 'cattle'],
            'araf': ['al-araf', 'heights'],
            'anfal': ['al-anfal', 'spoils of war'],
            'tawbah': ['al-tawbah', 'repentance'],
            'yunus': ['jonah'],
            'hud': ['hood'],
            'yusuf': ['joseph', 'al-yusuf'],
            'rad': ['al-rad', 'thunder'],
            'ibrahim': ['abraham'],
            'hijr': ['al-hijr', 'rocky tract'],
            'nahl': ['al-nahl', 'bee'],
            'isra': ['al-isra', 'night journey'],
            'yasin': ['ya-sin', 'yaseen'],
            'jinn': ['al-jinn'],
            'kursi': ['al-kursi', 'chair', 'throne']
        };
        this.initialized = false;
    }

    async init() {
        if (!this.initialized) {
            await this.loadVideoData();
            this.setupSearchInterface();
            this.initialized = true;
            console.log('ZikraVideoSearch initialized with', this.videos.length, 'videos');
        }
    }

    async loadVideoData() {
        try {
            // Try to load the JSON data first (more efficient for web)
            console.log('Attempting to load video data from JSON...');
            try {
                const response = await fetch('./Assets/data/video-data.json');
                if (response.ok) {
                    const data = await response.json();
                    this.videos = data;
                    console.log(`Loaded ${this.videos.length} videos from JSON`);
                    return this.videos;
                }
            } catch (jsonError) {
                console.log('JSON data not available, falling back to CSV:', jsonError);
            }
            
            // Fall back to CSV if JSON is not available
            const response = await fetch('./Assets/data/youtube_videos_complete.csv');
            if (!response.ok) {
                throw new Error(`Failed to load CSV: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.videos = this.parseCSV(csvText);
            console.log(`Loaded ${this.videos.length} videos from CSV`);
            
            // Filter out shorts
            this.filterShorts();
            return this.videos;
        } catch (error) {
            console.error('Error loading video data:', error);
            throw error;
        }
    }
    
    parseCSV(csvText) {
        const lines = csvText.split('\\n').filter(line => line.trim());
        
        if (lines.length <= 1) {
            console.warn('CSV file is empty or contains only headers');
            return [];
        }
        
        const headers = this.parseCSVLine(lines[0]);
        
        return lines.slice(1).map(line => {
            const values = this.parseCSVLine(line);
            const video = {};
            
            headers.forEach((header, index) => {
                video[header] = values[index] || '';
            });
            
            // Add video_url if not present
            if (!video.video_url && video.video_id) {
                video.video_url = `https://www.youtube.com/watch?v=${video.video_id}`;
            }
            
            return video;
        });
    }
    
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Push the last value
        result.push(current);
        
        // Clean up quotes from values
        return result.map(value => {
            if (value.startsWith('"') && value.endsWith('"')) {
                return value.substring(1, value.length - 1).replace(/""/g, '"');
            }
            return value;
        });
    }
    
    filterShorts() {
        const beforeCount = this.videos.length;
        
        this.filteredVideos = this.videos.filter(video => {
            // Identify shorts by duration (< 60s) or title containing "#shorts"
            const isShort = 
                (video.duration && this.parseDuration(video.duration) < 60) || 
                (video.title && video.title.toLowerCase().includes('#shorts'));
                
            return !isShort;
        });
        
        const shortsCount = beforeCount - this.filteredVideos.length;
        console.log(`Filtered out ${shortsCount} shorts, ${this.filteredVideos.length} videos remain`);
        
        // Use filtered videos for search
        this.videos = this.filteredVideos;
    }
    
    parseDuration(duration) {
        // Parse ISO 8601 duration format (PT1M30S)
        if (!duration || typeof duration !== 'string') return 0;
        
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;
        
        const hours = parseInt(match[1] || 0, 10);
        const minutes = parseInt(match[2] || 0, 10);
        const seconds = parseInt(match[3] || 0, 10);
        
        return hours * 3600 + minutes * 60 + seconds;
    }

    search(query, maxResults = 20) {
        console.log(`Searching for: "${query}"`);
        
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const searchTerms = this.expandSearchTerms(query);
        console.log('Expanded search terms:', searchTerms);
        
        const scoredVideos = this.videos
            .map(video => ({
                video,
                score: this.calculateScore(video, searchTerms)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults);
        
        console.log(`Found ${scoredVideos.length} results`);
        return scoredVideos.map(item => item.video);
    }

    calculateScore(video, searchTerms) {
        let score = 0;
        const title = (video.title || '').toLowerCase();
        const description = (video.description || '').toLowerCase();
        const tags = (video.tags || '').toLowerCase();

        for (const term of searchTerms) {
            if (title.includes(term)) {
                score += 10;
                if (this.isExactWordMatch(title, term)) score += 5;
            }
            if (tags.includes(term)) score += 5;
            if (description.includes(term)) score += 3;
            
            // Bonus points for term in video_id (sometimes contains meaningful info)
            if (video.video_id && video.video_id.toLowerCase().includes(term)) {
                score += 2;
            }
        }

        return score;
    }
    
    isExactWordMatch(text, term) {
        // Check if the term is surrounded by word boundaries
        const regex = new RegExp(`\\b${term}\\b`, 'i');
        return regex.test(text);
    }

    expandSearchTerms(query) {
        const terms = [];
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
        
        for (const word of words) {
            const normalized = this.normalizeSearchTerm(word);
            terms.push(normalized);
            
            // Add aliases for this term if available
            if (this.surahAliases[normalized]) {
                terms.push(...this.surahAliases[normalized]);
            }
            
            // Special case for Kahaf/Kahf which is commonly mistyped
            if (normalized === 'kahaf' && !terms.includes('kahf')) {
                terms.push('kahf');
                if (this.surahAliases['kahf']) {
                    terms.push(...this.surahAliases['kahf']);
                }
            }
        }
        
        // Add the full query as a term to prioritize exact matches
        if (words.length > 1) {
            terms.push(query.toLowerCase());
        }
        
        return [...new Set(terms.filter(t => t))];
    }

    normalizeSearchTerm(term) {
        term = term.toLowerCase().trim();
        const prefixes = ['surah', 'sura', 'al-', 'an-', 'at-', 'ar-', 'az-'];
        
        for (const prefix of prefixes) {
            if (term.startsWith(prefix)) {
                term = term.substring(prefix.length).trim();
                break;
            }
        }
        
        return term;
    }

    displayResults(results) {
        const container = document.getElementById('search-results');
        
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
        if (results.length === 0) {
            container.innerHTML = '<p>No videos found.</p>';
            return;
        }

        const html = results.map((video, index) => `
            <div class="video-result">
                <h3><a href="${video.video_url}" target="_blank">
                    ${video.title}
                </a></h3>
                <p class="video-date">${new Date(video.published_at).toDateString()}</p>
                <p class="video-description">${(video.description || '').substring(0, 150)}${(video.description || '').length > 150 ? '...' : ''}</p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    setupSearchInterface() {
        const searchInput = document.getElementById('video-search');
        const resultsContainer = document.getElementById('search-results');
        
        if (!searchInput || !resultsContainer) {
            console.warn('Search interface elements not found in the DOM');
            return;
        }
        
        // Debounced search function
        let searchTimeout;
        const debouncedSearch = (query) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const results = this.search(query);
                this.displayResults(results);
            }, 300);
        };
        
        // Setup search input handler
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }

            debouncedSearch(query);
        });
        
        // Setup search button if present
        const searchBtn = document.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const query = searchInput.value.trim();
                if (query.length >= 2) {
                    const results = this.search(query);
                    this.displayResults(results);
                }
            });
        }
        
        // Setup suggestion tags if present
        const suggestionTags = document.querySelectorAll('.suggestion-tag');
        if (suggestionTags.length > 0) {
            suggestionTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    const query = tag.textContent.trim();
                    searchInput.value = query;
                    const results = this.search(query);
                    this.displayResults(results);
                });
            });
        }
    }
}

// Auto-initialize if the search interface exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('video-search') || document.querySelector('.search-input')) {
        const searchEngine = new ZikraVideoSearch();
        window.zikraSearchEngine = searchEngine; // Make it available globally
        searchEngine.init();
    }
});
