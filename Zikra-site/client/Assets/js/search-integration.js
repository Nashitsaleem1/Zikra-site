/**
 * Zikra Search Integration
 * 
 * This file integrates the Zikra search engine with the existing website.
 * It provides backwards compatibility with any existing search implementation
 * while leveraging the new advanced search features.
 */

// Check if old search functions exist and provide compatibility layer
if (typeof searchInCSV === 'function' || typeof performSearch === 'function') {
    console.log('Detected existing search implementation. Integrating with enhanced search...');
    
    // Store references to the original functions if they exist
    const originalSearchInCSV = typeof searchInCSV === 'function' ? searchInCSV : null;
    const originalPerformSearch = typeof performSearch === 'function' ? performSearch : null;
    
    // Initialize the enhanced search engine
    const zikraSearch = new ZikraSearchEngine();
    
    // Replace the searchInCSV function with the enhanced version
    window.searchInCSV = function(query, callback) {
        console.log('Enhanced search being used for query:', query);
        
        // If the original implementation is available, still call it
        // but also use our enhanced search
        if (originalSearchInCSV) {
            originalSearchInCSV(query, callback);
        }
        
        // Use the enhanced search engine
        zikraSearch.loadVideoData().then(() => {
            const results = zikraSearch.search(query);
            
            // Format results to match the expected format of the original implementation
            const formattedResults = results.map(result => ({
                video_id: result.videoId,
                title: result.title,
                description: result.description,
                published_at: result.publishedAt,
                thumbnail_url: result.thumbnail
            }));
            
            // If a callback was provided, call it with the enhanced results
            if (typeof callback === 'function') {
                callback(formattedResults);
            }
            
            return formattedResults;
        });
    };
    
    // Replace the performSearch function with the enhanced version
    if (originalPerformSearch) {
        window.performSearch = function(query) {
            console.log('Enhanced performSearch being used for query:', query);
            
            // First call the original implementation
            const originalResults = originalPerformSearch(query);
            
            // Then use our enhanced search
            zikraSearch.loadVideoData().then(() => {
                const enhancedResults = zikraSearch.search(query);
                
                // Combine results, giving priority to enhanced results
                const combinedResults = [...enhancedResults];
                
                // Add any original results that weren't found in enhanced results
                if (originalResults && originalResults.length) {
                    originalResults.forEach(origResult => {
                        const found = combinedResults.some(enhResult => 
                            enhResult.videoId === origResult.video_id);
                        
                        if (!found) {
                            combinedResults.push({
                                videoId: origResult.video_id,
                                title: origResult.title,
                                description: origResult.description,
                                publishedAt: origResult.published_at,
                                thumbnail: origResult.thumbnail_url
                            });
                        }
                    });
                }
                
                // Display the enhanced results using the existing display function if available
                if (typeof displaySearchResults === 'function') {
                    // Format back to the expected format
                    const formattedForDisplay = combinedResults.map(result => ({
                        video_id: result.videoId,
                        title: result.title,
                        description: result.description,
                        published_at: result.publishedAt,
                        thumbnail_url: result.thumbnail
                    }));
                    
                    displaySearchResults(formattedForDisplay);
                }
                
                return combinedResults;
            });
            
            return originalResults;
        };
    }
    
    // Enhanced searchQuery function to replace the original if it exists
    if (typeof enhanceSearchQuery === 'function') {
        const originalEnhanceSearchQuery = enhanceSearchQuery;
        
        window.enhanceSearchQuery = function(query) {
            console.log('Enhanced query processing for:', query);
            
            // First try the original implementation
            const originalEnhanced = originalEnhanceSearchQuery(query);
            
            // Then use our enhanced surah name mapping
            const expandedTerms = zikraSearch.expandSearchTerms(query);
            
            // Combine the results
            let combinedTerms = originalEnhanced ? originalEnhanced.split(' ') : [query];
            
            // Add any new terms from our enhanced mapping
            expandedTerms.forEach(term => {
                if (!combinedTerms.includes(term)) {
                    combinedTerms.push(term);
                }
            });
            
            return combinedTerms.join(' ');
        };
    }
    
    console.log('Search integration complete. Enhanced search is now active.');
}
