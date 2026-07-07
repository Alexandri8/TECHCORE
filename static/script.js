// script.js - TechCore interactions and form handling

let lastFocusedElement;

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
                // Optimization: stop observing once animated to avoid re-triggering
                observer.unobserve(entry.target);
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

            // Dynamic visual feedback for character limit
            charCounter.classList.remove('text-warning', 'text-danger');
            if (length >= 980) {
                charCounter.classList.add('text-danger');
            } else if (length >= 900) {
                charCounter.classList.add('text-warning');
            }
        });
    }

    // 3. Mobile Menu Toggle - Consolidated Implementation
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav-links');
    const menuIcon = mobileBtn?.querySelector('i');

    if (mobileBtn && nav) {
        const toggleMenu = (forceState) => {
            const isOpen = forceState ?? !nav.classList.contains('active');
            nav.classList.toggle('active', isOpen);
            document.body.classList.toggle('no-scroll', isOpen);
            mobileBtn.setAttribute('aria-expanded', isOpen);

            if (menuIcon) {
                menuIcon.classList.toggle('fa-bars', !isOpen);
                menuIcon.classList.toggle('fa-times', isOpen);
            }
        };

        mobileBtn.addEventListener('click', () => toggleMenu());

        // Close menu when a link is clicked or clicking the backdrop
        nav.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target === nav) {
                toggleMenu(false);
            }
        });

        // Close on Escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && nav.classList.contains('active')) {
                toggleMenu(false);
            }
        });
    }

    // Modal Escape key listener
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("paymentModal");
            if (modal?.style.display === "block" || modal?.classList.contains('show')) {
                closePaymentModal();
            }
        }
    });

    // Event Listeners for Contact Form
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // Payment Modal Listeners
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

    // 4. Handle Server-side Payment Notifications
    const paymentStatus = document.body.dataset.paymentStatus;
    if (paymentStatus === 'success') {
        showNotification("Payment Successful! We will contact you shortly.", 'success');
    } else if (paymentStatus === 'failed') {
        showNotification("Payment Failed. Please try again.", 'error');
    }
});

// 4. Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
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

    if (!name || !email || !message) return;

    // UI Loading state
    submitBtn.classList.add('loading');
    responseBox.className = 'form-response show';
    responseBox.innerText = "Transmitting payload...";

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
            submitBtn.classList.remove('loading');

            const originalContent = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Message Sent</span> <i class="fas fa-check"></i>';
            submitBtn.classList.add('btn-success');

            responseBox.className = 'form-response show success';
            responseBox.innerText = data.status || "Transmission successful. Acknowledged.";

            setTimeout(() => {
                submitBtn.innerHTML = originalContent;
                submitBtn.classList.remove('btn-success');
            }, 3000);

            // Clear form
            nameInput.value = '';
            emailInput.value = '';
            messageInput.value = '';
            const charCounter = document.getElementById("charCounter");
            if (charCounter) {
                charCounter.innerText = "0 / 1000";
                charCounter.classList.remove('text-warning', 'text-danger');
            }

            setTimeout(() => {
                responseBox.classList.remove('show');
            }, 5000);
        })
        .catch(error => {
            submitBtn.classList.remove('loading');
            responseBox.className = 'form-response show error';
            responseBox.innerText = "Transmission failed. Check network integrity.";
            console.error('Contact Form Error:', error);
        });
}

// 4. Payment Handling
function openPaymentModal() {
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById("paymentModal");
    const openBtn = document.getElementById("openPaymentBtn");

    modal.style.display = "block";
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');

    const payEmail = document.getElementById("payEmail");
    if (payEmail) payEmail.focus();
}

function closePaymentModal() {
    const modal = document.getElementById("paymentModal");
    const openBtn = document.getElementById("openPaymentBtn");

    modal.style.display = "none";
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function payWithPaystack() {
    const emailInput = document.getElementById("payEmail");
    const email = emailInput.value;
    const payBtn = document.getElementById("payBtn");

    if (!email || !emailInput.checkValidity()) {
        showNotification("Please enter a valid email.", 'error');
        return;
    }

    payBtn.classList.add('loading');
    payBtn.disabled = true;

    if (!payBtn.querySelector('.loader')) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        payBtn.appendChild(loader);
    }

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
window.onclick = (e) => {
    if (e.target == document.getElementById("paymentModal")) closePaymentModal();
}
