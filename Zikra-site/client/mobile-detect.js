/**
 * Mobile detection and warning popup for Zikra Friday and Ramzan pages
 * This script shows a warning for mobile users and redirects them based on their choice
 */

class MobileDetector {
    constructor() {
        this.isMobile = this.checkIfMobile();
        this.currentPage = window.location.pathname;
        this.isTargetPage = this.checkIfTargetPage();
    }

    // Check if the device is mobile based on screen width and user agent
    checkIfMobile() {
        // Check screen width
        const isMobileWidth = window.innerWidth < 768;
        
        // Also check user agent as fallback
        const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        return isMobileWidth || isMobileAgent;
    }

    // Check if current page is one of the target pages (Friday Class or Ramzan)
    checkIfTargetPage() {
        const targetPages = ['/ramzan/index.html', '/ramzan/ramzan.html', 'index.html', 'ramzan.html'];
        
        // Extract the page name from the path
        const pathParts = this.currentPage.split('/');
        const pageName = pathParts[pathParts.length - 1];
        
        // Also check if we're in a folder called 'ramzan'
        const isInRamzanFolder = this.currentPage.includes('/ramzan/');
        
        // Check if this is one of our target pages
        return targetPages.includes(pageName) || isInRamzanFolder;
    }

    // Show warning popup for mobile users
    showWarningPopup() {
        if (!this.isMobile || !this.isTargetPage) {
            return; // Don't show popup for desktop or non-target pages
        }

        // Create popup container
        const popupOverlay = document.createElement('div');
        popupOverlay.className = 'mobile-warning-overlay';
        
        // Create popup content
        const popupContent = document.createElement('div');
        popupContent.className = 'mobile-warning-content';
        
        // Add popup message and buttons
        popupContent.innerHTML = `
            <div class="warning-icon">
                <i class="fas fa-mobile-alt"></i>
            </div>
            <h3>Mobile Device Detected</h3>
            <p>For the best experience of the ${this.getPageName()}, please access it on a laptop or larger screen.</p>
            <div class="warning-buttons">
                <button class="home-btn">Go to Home</button>
                <button class="continue-btn">Continue Anyway</button>
            </div>
        `;
        
        // Add to DOM
        popupOverlay.appendChild(popupContent);
        document.body.appendChild(popupOverlay);
        
        // Add event listeners to buttons
        const homeBtn = popupContent.querySelector('.home-btn');
        const continueBtn = popupContent.querySelector('.continue-btn');
        
        homeBtn.addEventListener('click', () => {
            // Store flag in session storage to prevent showing popup again in this session
            sessionStorage.setItem('mobileWarningShown', 'true');
            
            // Redirect to home page - handle different folder levels
            const homeUrl = this.currentPage.includes('/ramzan/') ? '../index.html' : '/index.html';
            window.location.href = homeUrl;
        });
        
        continueBtn.addEventListener('click', () => {
            // Store flag in session storage to prevent showing popup again in this session
            sessionStorage.setItem('mobileWarningShown', 'true');
            
            // Remove the popup
            document.body.removeChild(popupOverlay);
        });
    }
    
    // Helper to determine if current page is Ramzan
    isRamzanPage() {
        return this.currentPage.includes('ramzan.html');
    }
    
    // Get appropriate page name for the warning message
    getPageName() {
        if (this.currentPage.includes('ramzan.html')) {
            return 'Ramzan Page';
        } else if (this.currentPage.includes('index.html') && this.currentPage.includes('/ramzan/')) {
            return 'Friday Class';
        } else {
            return 'this page';
        }
    }
    
    // Initialize - call this method to start the detection
    init() {
        // Check if we've already shown the warning in this session
        if (sessionStorage.getItem('mobileWarningShown')) {
            return;
        }
        
        // Add event listener to show popup after page loads
        window.addEventListener('DOMContentLoaded', () => {
            this.showWarningPopup();
        });
    }
}

// Initialize the mobile detector
const mobileDetector = new MobileDetector();
mobileDetector.init();
