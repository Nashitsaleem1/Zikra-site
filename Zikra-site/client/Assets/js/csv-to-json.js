/**
 * CSV to JSON Converter for Zikra Video Data
 * 
 * This script converts the YouTube video data from CSV format to JSON
 * for better performance with the search engine.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'youtube_videos_complete.csv');
const JSON_FILE_PATH = path.join(__dirname, '..', 'data', 'video-data.json');

// Ensure directory exists
const jsonDir = path.dirname(JSON_FILE_PATH);
if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
}

// Array to store all video data
const videoData = [];

// Parse CSV and convert to JSON
fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv())
    .on('data', (row) => {
        // Transform the CSV row into a clean JSON object
        const videoObject = {
            videoId: row.video_id || row.videoId,
            title: row.title,
            description: row.description,
            publishedAt: row.published_at || row.publishedAt,
            thumbnail: row.thumbnail_url || row.thumbnailUrl || `https://i.ytimg.com/vi/${row.video_id || row.videoId}/mqdefault.jpg`,
            tags: row.tags ? row.tags.split(',').map(tag => tag.trim()) : []
        };
        
        // Add additional metadata if available
        if (row.surah_name) videoObject.surahName = row.surah_name;
        if (row.ayah_number) videoObject.ayahNumber = row.ayah_number;
        if (row.juz_number) videoObject.juzNumber = row.juz_number;
        if (row.para_number) videoObject.paraNumber = row.para_number;
        if (row.category) videoObject.category = row.category;
        
        // Add to the array
        videoData.push(videoObject);
    })
    .on('end', () => {
        // Sort videos by published date (newest first)
        videoData.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        // Write to JSON file
        fs.writeFileSync(
            JSON_FILE_PATH, 
            JSON.stringify(videoData, null, 2)
        );
        
        console.log(`Conversion complete! ${videoData.length} videos processed.`);
        console.log(`JSON file saved to: ${JSON_FILE_PATH}`);
    })
    .on('error', (error) => {
        console.error('Error converting CSV to JSON:', error);
    });
