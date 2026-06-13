// script.js - TechCore interactions and form handling

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation background change on scroll (Optimized with IntersectionObserver)
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');

    if (navbar && hero) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // If hero is NOT intersecting the top 50px, add 'scrolled' class
                if (!entry.isIntersecting) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }, {
            rootMargin: '-50px 0px 0px 0px',
            threshold: 0
        });
        navObserver.observe(hero);
    }

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

    // Character Counter for Contact Form
    const messageInput = document.getElementById("message");
    const charCounter = document.getElementById("charCounter");
    if (messageInput && charCounter) {
        messageInput.addEventListener("input", () => {
            const length = messageInput.value.length;
            charCounter.innerText = `${length} / 1000`;
        });
    }

    // Modal Keyboard Accessibility
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            const modal = document.getElementById("paymentModal");
            if (modal && modal.style.display === "block") {
                closePaymentModal();
            }
        }
    });

    // Trigger animations for elements already in viewport on load
    setTimeout(() => {
        animateElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('visible');
            }
        });
    }, 100);

    // 3. Event Listeners (Removed inline JS from HTML)
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    const openPaymentBtn = document.getElementById("openPaymentBtn");
    if (openPaymentBtn) {
        openPaymentBtn.addEventListener("click", openPaymentModal);
    }

    const closePaymentBtn = document.getElementById("closePaymentBtn");
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener("click", closePaymentModal);
    }

    const payBtn = document.getElementById("payBtn");
    if (payBtn) {
        payBtn.addEventListener("click", payWithPaystack);
    }
});

// 4. Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerText = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 5000);
}

// 5. Form Handling via Fetch API
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
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
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
            const charCounter = document.getElementById("charCounter");
            if (charCounter) charCounter.innerText = "0 / 1000";

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

// 4. Payment Handling
function openPaymentModal() {
    document.getElementById("paymentModal").style.display = "block";
    const payEmail = document.getElementById("payEmail");
    if (payEmail) payEmail.focus();
}

function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
}

function payWithPaystack() {
    const emailInput = document.getElementById("payEmail");
    const email = emailInput.value;
    const payBtn = document.getElementById("payBtn");

    if (!email || !emailInput.checkValidity()) {
        showNotification("Please enter a valid email.", 'error');
        return;
    }

    // UI Loading state
    payBtn.classList.add('loading');
    payBtn.disabled = true;

    // Inject a spinner temporarily inside button (CSS handles display)
    if (!payBtn.querySelector('.loader')) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        payBtn.appendChild(loader);
    }

    // Amount is ₦5,000 = 500,000 Kobo
    const amount = 500000; 

    fetch("/initialize-payment", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status) {
            // Redirect to Paystack checkout page
            window.location.href = data.data.authorization_url;
        } else {
            payBtn.classList.remove('loading');
            payBtn.disabled = false;
            showNotification("Payment initialization failed: " + data.message, 'error');
        }
    })
    .catch(error => {
        payBtn.classList.remove('loading');
        payBtn.disabled = false;
        console.error("Payment Error:", error);
        showNotification("An error occurred during payment initialization.", 'error');
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("paymentModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}
