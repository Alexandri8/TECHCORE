// script.js - TechCore interactions and form handling

let lastFocusedElement;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation background change on scroll (Optimized with IntersectionObserver)
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');

    if (navbar && hero) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
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
    // Performance: Added unobserve to reduce runtime overhead after initial trigger
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll(
        '.fade-in, .fade-in-up, .fade-in-left, .fade-in-right'
    );
    animateElements.forEach(el => animationObserver.observe(el));

    // 3. Consolidated Mobile Menu Logic
    // Performance: Replaced multiple redundant implementations with a single robust version
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('i') : null;

    const toggleMobileMenu = (forceState) => {
        const isOpen = forceState !== undefined ? forceState : !navLinks.classList.contains('active');

        navLinks.classList.toggle('active', isOpen);
        document.body.classList.toggle('no-scroll', isOpen);
        mobileMenuBtn?.setAttribute('aria-expanded', isOpen);

        if (menuIcon) {
            menuIcon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        }
    };

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close menu on link click or backdrop click
        navLinks.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target === navLinks) {
                toggleMobileMenu(false);
            }
        });
    }

    // Global keyboard listener for accessibility (Escape key)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("paymentModal");
            if (modal?.style.display === "block") {
                closePaymentModal();
            }
            if (navLinks?.classList.contains('active')) {
                toggleMobileMenu(false);
            }
        }
    });

    // 4. Character Counter for Contact Form
    const messageInput = document.getElementById("message");
    const charCounter = document.getElementById("charCounter");
    if (messageInput && charCounter) {
        messageInput.addEventListener("input", () => {
            const length = messageInput.value.length;
            charCounter.innerText = `${length} / 1000`;
            charCounter.classList.remove('text-warning', 'text-danger');
            if (length >= 980) charCounter.classList.add('text-danger');
            else if (length >= 900) charCounter.classList.add('text-warning');
        });
    }

    // 5. Form and Modal Event Listeners
    document.getElementById("contactForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage();
    });

    document.getElementById("openPaymentBtn")?.addEventListener("click", openPaymentModal);
    document.getElementById("closePaymentBtn")?.addEventListener("click", closePaymentModal);
    document.getElementById("payBtn")?.addEventListener("click", payWithPaystack);

    // 6. Handle Server-side Payment Notifications
    const paymentStatus = document.body.dataset.paymentStatus;
    if (paymentStatus === 'success') {
        showNotification("Payment Successful! We will contact you shortly.", 'success');
    } else if (paymentStatus === 'failed') {
        showNotification("Payment Failed. Please try again.", 'error');
    }
});

// Notification System
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

// Form Handling
function sendMessage() {
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");
    const submitBtn = document.getElementById("submitBtn");
    const responseBox = document.getElementById("response");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !email || !message) return;

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
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        submitBtn.classList.remove('loading');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Message Sent</span> <i class="fas fa-check"></i>';
        submitBtn.classList.add('btn-success');

        responseBox.className = 'form-response show success';
        responseBox.innerText = data.status || "Transmission successful.";

        setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.classList.remove('btn-success');
        }, 3000);

        nameInput.value = '';
        emailInput.value = '';
        messageInput.value = '';
        const charCounter = document.getElementById("charCounter");
        if (charCounter) charCounter.innerText = "0 / 1000";

        setTimeout(() => responseBox.classList.remove('show'), 5000);
    })
    .catch(error => {
        submitBtn.classList.remove('loading');
        responseBox.className = 'form-response show error';
        responseBox.innerText = "Transmission failed.";
        console.error('Contact Form Error:', error);
    });
}

// Payment Handling
function openPaymentModal() {
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById("paymentModal");
    const openBtn = document.getElementById("openPaymentBtn");

    modal.style.display = "block";
    openBtn?.setAttribute('aria-expanded', 'true');
    document.getElementById("payEmail")?.focus();
}

function closePaymentModal() {
    const modal = document.getElementById("paymentModal");
    const openBtn = document.getElementById("openPaymentBtn");

    modal.style.display = "none";
    openBtn?.setAttribute('aria-expanded', 'false');
    lastFocusedElement?.focus();
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
        showNotification("An error occurred.", 'error');
    });
}

window.onclick = (e) => {
    if (e.target == document.getElementById("paymentModal")) closePaymentModal();
};
