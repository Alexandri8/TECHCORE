// script.js - TechCore interactions and form handling (Optimized)

let lastFocusedElement;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Navigation background change on scroll (Optimized with IntersectionObserver)
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');

    if (navbar && hero) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                navbar.classList.toggle('scrolled', !entry.isIntersecting);
            });
        }, { rootMargin: '-50px 0px 0px 0px', threshold: 0 });
        navObserver.observe(hero);
    }

    // 2. Intersection Observer for Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right')
        .forEach(el => observer.observe(el));

    // 3. Mobile Menu Toggle (Consolidated)
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = mobileBtn?.querySelector('i');

    const toggleMenu = (state) => {
        const isActive = state ?? !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', isActive);
        document.body.classList.toggle('no-scroll', isActive);
        mobileBtn?.setAttribute('aria-expanded', isActive);
        if (menuIcon) {
            menuIcon.classList.toggle('fa-bars', !isActive);
            menuIcon.classList.toggle('fa-times', isActive);
        }
    };

    mobileBtn?.addEventListener('click', () => toggleMenu());
    navLinks?.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target === navLinks) toggleMenu(false);
    });

    // 4. Global Keyboard Listeners (Escape key)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById("paymentModal");
            if (modal?.style.display === "block") closePaymentModal();
            if (navLinks?.classList.contains('active')) toggleMenu(false);
        }
    });

    // 5. Contact Form Character Counter
    const messageInput = document.getElementById("message");
    const charCounter = document.getElementById("charCounter");
    messageInput?.addEventListener("input", () => {
        const len = messageInput.value.length;
        charCounter.innerText = `${len} / 1000`;
        charCounter.classList.toggle('text-warning', len >= 900 && len < 980);
        charCounter.classList.toggle('text-danger', len >= 980);
    });

    // 6. Form and Modal Event Listeners
    document.getElementById("contactForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage();
    });

    document.getElementById("openPaymentBtn")?.addEventListener("click", openPaymentModal);
    document.getElementById("closePaymentBtn")?.addEventListener("click", closePaymentModal);
    document.getElementById("payBtn")?.addEventListener("click", payWithPaystack);

    // 7. Handle Server-side Payment Notifications
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
    .then(r => r.ok ? r.json() : Promise.reject())
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

        nameInput.value = emailInput.value = messageInput.value = '';
        const charCounter = document.getElementById("charCounter");
        if (charCounter) charCounter.innerText = "0 / 1000";
    })
    .catch(() => {
        submitBtn.classList.remove('loading');
        responseBox.className = 'form-response show error';
        responseBox.innerText = "Transmission failed.";
    });
}

// Payment Modal Handling
function openPaymentModal() {
    lastFocusedElement = document.activeElement;
    document.getElementById("paymentModal").style.display = "block";
    document.getElementById("openPaymentBtn")?.setAttribute('aria-expanded', 'true');
    document.getElementById("payEmail")?.focus();
}

function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
    document.getElementById("openPaymentBtn")?.setAttribute('aria-expanded', 'false');
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
    .then(r => r.json())
    .then(data => {
        if (data.status) {
            window.location.href = data.data.authorization_url;
        } else {
            throw new Error(data.message);
        }
    })
    .catch(err => {
        payBtn.classList.remove('loading');
        payBtn.disabled = false;
        showNotification("Error: " + err.message, 'error');
    });
}

// Close modal when clicking outside
window.onclick = (e) => {
    const modal = document.getElementById("paymentModal");
    if (e.target === modal) closePaymentModal();
}
