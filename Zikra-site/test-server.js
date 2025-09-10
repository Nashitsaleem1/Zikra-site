/**
 * Simple HTTP server for testing the Zikra Search functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8081;
const CLIENT_DIR = path.join(__dirname, 'client');

// MIME types for different file extensions
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.eot': 'application/vnd.ms-fontobject'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);
    
    // Normalize URL to remove query strings and hash fragments
    let url = req.url.split('?')[0].split('#')[0];
    
    // Add index.html for directory requests
    if (url.endsWith('/')) {
        url += 'index.html';
    }
    
    // Handle root request
    if (url === '/') {
        url = '/search.html';
    }
    
    // Build file path
    const filePath = path.join(CLIENT_DIR, url);
    
    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    
    // Set content type based on file extension
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Try to read and serve the file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // If file not found, send 404
            if (err.code === 'ENOENT') {
                console.error(`File not found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The requested resource was not found on this server.</p>');
                return;
            }
            
            // If other error, send 500
            console.error(`Server error: ${err}`);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>500 Internal Server Error</h1><p>Sorry, something went wrong on the server.</p>');
            return;
        }
        
        // If file found, serve it
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Open http://localhost:${PORT}/search.html to test the search functionality`);
});
