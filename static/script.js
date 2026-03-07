// script.js - TechCore interactions and form handling

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated to avoid re-triggering
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements to animate
    const animateElements = document.querySelectorAll(
        '.fade-in, .fade-in-up, .fade-in-left, .fade-in-right'
    );

    animateElements.forEach(el => observer.observe(el));

    // Trigger animations for elements already in viewport on load
    setTimeout(() => {
        animateElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('visible');
            }
        });
    }, 100);
});

// 3. Form Handling via Fetch API
function sendMessage() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");
    const responseBox = document.getElementById("response");

    // Get values
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) return; // Basic validation handled by HTML5, just a safety check

    // UI Loading state
    submitBtn.classList.add('loading');
    responseBox.className = 'form-response show';
    responseBox.innerText = "Transmitting payload...";

    // Inject a spinner temporarily inside button (CSS handles display)
    if (!submitBtn.querySelector('.loader')) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        submitBtn.appendChild(loader);
    }

    fetch("/contact", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, message })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Success
            submitBtn.classList.remove('loading');
            responseBox.className = 'form-response show success';
            responseBox.innerText = data.status || "Transmission successful. Acknowledged.";

            // Clear form
            nameInput.value = '';
            emailInput.value = '';
            messageInput.value = '';

            // Hide message after a while
            setTimeout(() => {
                responseBox.classList.remove('show');
            }, 5000);
        })
        .catch(error => {
            // Error
            submitBtn.classList.remove('loading');
            responseBox.className = 'form-response show error';
            responseBox.innerText = "Transmission failed. Check network integrity.";
            console.error('Contact Form Error:', error);
        });
}
