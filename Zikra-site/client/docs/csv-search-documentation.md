# CSV-Based YouTube Search Implementation

This document explains the new CSV-based approach for searching YouTube videos, which helps avoid API quota limitations.

## Overview

Instead of making direct API calls to YouTube, which have strict daily quotas, this implementation:

1. Fetches YouTube data once per day using a scheduled script
2. Stores the data in a CSV file
3. Performs searches directly against the CSV data

This approach eliminates API quota issues during user searches and improves performance.

## Components

### 1. CSV Data Service (`csv-data-service.js`)

A JavaScript module that:
- Loads and parses the CSV file
- Provides search functionality with filtering and sorting
- Caches data in memory for better performance

### 2. Update Script (`update-csv.js`)

A Node.js script that:
- Fetches the latest videos from the YouTube API
- Merges them with existing data
- Updates the CSV file daily
- Logs all operations

### 3. Task Scheduler (`update-scheduler.bat`)

A Windows batch script that:
- Sets up a daily scheduled task to run the update script
- Runs at 3:00 AM to minimize disruption
- Logs update status

### 4. Search Implementation (`search-csv.js`)

A frontend script that:
- Interfaces with the CSV Data Service
- Handles user search queries and filters
- Displays search results
- Manages the video player modal

## How to Use

### Initial Setup

1. **Create the data directory**:
   Ensure there's a `data` directory in the client folder:
   ```
   client/data/
   ```

2. **Run the scheduler setup**:
   Double-click `update-scheduler.bat` to:
   - Create the initial CSV file
   - Set up the daily update task
   - This requires administrator privileges

3. **Link the new search page**:
   Add a link to `search-tarjama-csv.html` from your main navigation menu.

### Daily Updates

The scheduler will automatically:
- Run daily at 3:00 AM
- Fetch new videos from YouTube
- Update the CSV file
- Log operations to `data/update_log.txt`

### Manual Updates

If needed, you can manually update the CSV file by:
1. Opening Command Prompt
2. Navigating to the client folder
3. Running: `node update-csv.js`

## Benefits

1. **No API Quota Limitations**:
   - YouTube API has a daily quota of 10,000 units
   - A single search request uses 100 units
   - With direct API calls, you're limited to 100 searches per day
   - The CSV approach allows unlimited searches

2. **Better Performance**:
   - Searching local data is faster than API calls
   - Results appear almost instantly

3. **Works Offline**:
   - Once the CSV is generated, search works without internet connection
   - Great for demonstrations or unstable connections

4. **More Control**:
   - Custom relevance sorting
   - Better filtering options
   - Consistent results

## Maintenance

### Updating YouTube API Key

If you need to change the API key:
1. Edit `update-csv.js`
2. Change the `API_KEY` constant
3. Run a manual update to verify it works

### Troubleshooting

If search results aren't updating:
1. Check `data/update_log.txt` for errors
2. Verify the scheduled task is running (Task Scheduler)
3. Check if the CSV file is being updated
4. Try running a manual update

## File Locations

- CSV Data: `client/data/youtube_videos.csv`
- Update Log: `client/data/update_log.txt`
- CSV Backup: `client/data/youtube_videos_backup.csv`
- Scripts: 
  - `client/js/csv-data-service.js`
  - `client/js/search-csv.js`
  - `client/update-csv.js`
  - `client/update-scheduler.bat`
- HTML: `client/search-tarjama-csv.html`
