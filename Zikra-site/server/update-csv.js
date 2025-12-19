import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { format } from 'date-fns';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// YouTube API Configuration
const apiKey = process.env.GOOGLE_API_KEY;
const CHANNEL_ID = 'UCLYuowOAkMxiPFNWEDzqldQ';
const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Paths
const CSV_PATH = path.join(__dirname, '..', 'client', 'Assets', 'data', 'youtube_videos.csv');
const COMPLETE_CSV_PATH = path.join(__dirname, '..', 'client', 'Assets', 'data', 'youtube_videos_complete.csv');
const BACKUP_DIR = path.join(__dirname, '..', 'client', 'Assets', 'data', 'backups');

// Make sure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// CSV Headers
const CSV_HEADERS = ['video_id', 'title', 'description', 'tags', 'published_at', 'duration', 'view_count'];

/**
 * Main function to update the CSV file
 */
async function updateYouTubeCSV() {
    console.log('Starting YouTube CSV update...');
    
    try {
        // Create a backup of the current CSV file
        backupCurrentCSV();
        
        // Get the channel's uploads playlist ID
        const uploadsPlaylistId = await getUploadsPlaylistId();
        console.log(`Channel uploads playlist ID: ${uploadsPlaylistId}`);
        
        if (!uploadsPlaylistId) {
            throw new Error('Could not get uploads playlist ID');
        }
        
        // Fetch all videos from the uploads playlist
        const videos = await fetchAllVideosFromPlaylist(uploadsPlaylistId);
        console.log(`Fetched ${videos.length} videos from YouTube`);
        
        if (videos.length === 0) {
            console.error('No videos fetched. Aborting update.');
            return;
        }
        
        // Convert videos to CSV format
        const csvData = convertToCSV(videos);
        
        // Write the CSV files
        fs.writeFileSync(CSV_PATH, csvData, 'utf8');
        fs.writeFileSync(COMPLETE_CSV_PATH, csvData, 'utf8');
        
        console.log(`CSV files updated successfully at ${new Date().toISOString()}`);
        console.log(`Total videos in CSV: ${videos.length}`);
    } catch (error) {
        console.error('Error updating CSV:', error.message);
        
        if (error.response) {
            console.error('API error details:', error.response.data);
        }
    }
}

/**
 * Create a backup of the current CSV file
 */
function backupCurrentCSV() {
    if (fs.existsSync(CSV_PATH)) {
        const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
        const backupPath = path.join(BACKUP_DIR, `youtube_videos_${timestamp}.csv`);
        
        fs.copyFileSync(CSV_PATH, backupPath);
        console.log(`Backup created at ${backupPath}`);
    } else {
        console.log('No existing CSV file to backup');
    }
}

/**
 * Get the uploads playlist ID for a channel
 */
async function getUploadsPlaylistId() {
    try {
        const response = await axios.get(`${API_BASE_URL}/channels`, {
            params: {
                key: API_KEY,
                id: CHANNEL_ID,
                part: 'contentDetails'
            }
        });
        
        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].contentDetails.relatedPlaylists.uploads;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching uploads playlist ID:', error.message);
        throw error;
    }
}

/**
 * Fetch all videos from a playlist
 */
async function fetchAllVideosFromPlaylist(playlistId) {
    let allVideos = [];
    let nextPageToken = null;
    let totalVideos = 0;
    let pageCount = 0;
    
    try {
        do {
            pageCount++;
            console.log(`Fetching playlist items page ${pageCount}...`);
            
            // Fetch playlist items (video IDs)
            const playlistResponse = await axios.get(`${API_BASE_URL}/playlistItems`, {
                params: {
                    key: API_KEY,
                    playlistId: playlistId,
                    part: 'snippet,contentDetails',
                    maxResults: 50,
                    ...(nextPageToken && { pageToken: nextPageToken })
                }
            });
            
            if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
                break;
            }
            
            // Extract video IDs
            const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);
            totalVideos += videoIds.length;
            
            // Fetch detailed information for these videos
            const videoDetails = await fetchVideoDetails(videoIds);
            
            // Add to our collection
            allVideos = [...allVideos, ...videoDetails];
            
            console.log(`Fetched page ${pageCount} with ${videoDetails.length} videos. Total fetched so far: ${allVideos.length}`);
            
            // Update token for next page
            nextPageToken = playlistResponse.data.nextPageToken;
            
            // Add a small delay to avoid rate limits
            if (nextPageToken) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
        } while (nextPageToken);
        
        console.log(`Total videos found in uploads playlist: ${totalVideos}`);
        console.log(`Total videos with details successfully fetched: ${allVideos.length}`);
        
        return allVideos;
    } catch (error) {
        console.error('Error fetching videos from playlist:', error.message);
        
        // Still return whatever videos we've fetched so far
        return allVideos;
    }
}

/**
 * Fetch detailed information for a batch of videos
 */
async function fetchVideoDetails(videoIds) {
    if (videoIds.length === 0) return [];
    
    try {
        const detailsParams = {
            key: API_KEY,
            id: videoIds.join(','),
            part: 'snippet,contentDetails,statistics'
        };
        
        const detailsResponse = await axios.get(`${API_BASE_URL}/videos`, { params: detailsParams });
        
        if (!detailsResponse.data.items) return [];
        
        // Process and return the detailed video information
        return detailsResponse.data.items.map(video => {
            return {
                video_id: video.id,
                title: video.snippet.title,
                description: video.snippet.description,
                tags: (video.snippet.tags || []).join(','),
                published_at: video.snippet.publishedAt,
                duration: video.contentDetails.duration,
                view_count: video.statistics.viewCount
            };
        });
    } catch (error) {
        console.error(`Error fetching video details: ${error.message}`);
        return [];
    }
}

/**
 * Convert video objects to CSV format
 */
function convertToCSV(videos) {
    // Create header row
    let csvContent = CSV_HEADERS.join(',') + '\n';
    
    // Add data rows
    videos.forEach(video => {
        const row = CSV_HEADERS.map(header => {
            let value = video[header] || '';
            
            // Escape commas and quotes in values
            if (value.includes('"') || value.includes(',') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            
            return value;
        });
        
        csvContent += row.join(',') + '\n';
    });
    
    return csvContent;
}

// Execute the update
updateYouTubeCSV()
    .then(() => {
        console.log('CSV update completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
