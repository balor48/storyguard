// Back to Top Button Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log("Back to Top script loaded");
    
    // Create the back to top button if it doesn't exist
    if (!document.getElementById('backToTopBtn')) {
        const backToTopBtn = document.createElement('button');
        backToTopBtn.id = 'backToTopBtn';
        backToTopBtn.title = 'Go to top';
        backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        document.body.appendChild(backToTopBtn);
        console.log("Back to Top button created");
    }
    
    const backToTopBtn = document.getElementById('backToTopBtn');
    
    // Show button when user scrolls down 100px (reduced from 300px)
    window.addEventListener('scroll', function() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        
        if (scrollTop > 100) {
            if (!backToTopBtn.classList.contains('visible')) {
                backToTopBtn.classList.add('visible');
            }
        } else {
            if (backToTopBtn.classList.contains('visible')) {
                backToTopBtn.classList.remove('visible');
            }
        }
    });
    
    // Smooth scroll to top when button clicked
    backToTopBtn.addEventListener('click', function() {
        // For modern browsers
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        // For older browsers that don't support smooth scrolling
        function scrollToTop(duration) {
            const scrollStep = -window.scrollY / (duration / 15);
            const scrollInterval = setInterval(function() {
                if (window.scrollY !== 0) {
                    window.scrollBy(0, scrollStep);
                } else {
                    clearInterval(scrollInterval);
                }
            }, 15);
        }
        
        // Use the fallback for browsers that don't support smooth scrolling
        if (typeof window.scrollTo !== 'function' || typeof window.scrollTo.behavior !== 'string') {
            scrollToTop(500); // 500ms duration
        }
    });
    
    // Temporarily show the button after 2 seconds for testing purposes
    setTimeout(function() {
        backToTopBtn.classList.add('visible');
        console.log("Back to Top button made visible for testing");
        
        // Hide it again after 5 seconds if the user hasn't scrolled
        setTimeout(function() {
            if (document.documentElement.scrollTop < 100 && document.body.scrollTop < 100) {
                backToTopBtn.classList.remove('visible');
            }
        }, 5000);
    }, 2000);
    
    console.log("Back to Top button initialized");
});