/**
 * script.js - TechCore interactions and form handling
 *
 * PERFORMANCE OPTIMIZATION:
 * 1. Consolidated DOM queries to prevent redundant lookups.
 * 2. Removed 4 redundant mobile menu implementations, reducing JS size.
 * 3. Enabled 'unobserve' in IntersectionObserver to minimize runtime resource usage.
 * 4. Removed layout-thrashing getBoundingClientRect loop; IntersectionObserver handles initial reveal.
 */

let lastFocusedElement;

document.addEventListener("DOMContentLoaded", () => {
    // Cache common DOM elements
    const elements = {
        navbar: document.querySelector('.navbar'),
        hero: document.querySelector('.hero'),
        mobileBtn: document.querySelector('.mobile-menu-btn'),
        navLinks: document.querySelector('.nav-links'),
        contactForm: document.getElementById("contactForm"),
        openPaymentBtn: document.getElementById("openPaymentBtn"),
        closePaymentBtn: document.getElementById("closePaymentBtn"),
        payBtn: document.getElementById("payBtn"),
        messageInput: document.getElementById("message"),
        charCounter: document.getElementById("charCounter"),
        paymentModal: document.getElementById("paymentModal"),
        csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    };

    // 1. Navigation Background Change (IntersectionObserver)
    if (elements.navbar && elements.hero) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                elements.navbar.classList.toggle('scrolled', !entry.isIntersecting);
            });
        }, { rootMargin: '-50px 0px 0px 0px', threshold: 0 });
        navObserver.observe(elements.hero);
    }

    // 2. Scroll Reveal Animations (Optimized with unobserve)
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target); // Stop watching after reveal
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in, .fade-in-up, .fade-in-left, .fade-in-right')
        .forEach(el => revealObserver.observe(el));

    // 3. Mobile Menu Logic (Single Implementation)
    const toggleMenu = (forceState) => {
        if (!elements.mobileBtn || !elements.navLinks) return;

        const isOpening = typeof forceState === 'boolean' ? forceState : !elements.navLinks.classList.contains('active');
        const icon = elements.mobileBtn.querySelector('i');

        elements.navLinks.classList.toggle('active', isOpening);
        document.body.classList.toggle('no-scroll', isOpening);
        elements.mobileBtn.setAttribute('aria-expanded', isOpening);

        if (icon) {
            icon.className = isOpening ? 'fas fa-times' : 'fas fa-bars';
        }
    };

    elements.mobileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking links or backdrop
    elements.navLinks?.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target === elements.navLinks) {
            toggleMenu(false);
        }
    });

    // 4. Contact Form Logic
    if (elements.messageInput && elements.charCounter) {
        elements.messageInput.addEventListener("input", () => {
            const len = elements.messageInput.value.length;
            elements.charCounter.innerText = `${len} / 1000`;
            elements.charCounter.className = `text-sm mt-xs text-right ${len >= 980 ? 'text-danger' : len >= 900 ? 'text-warning' : 'text-muted'}`;
        });
    }

    elements.contactForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        handleContactSubmit(elements);
    });

    // 5. Payment Modal Logic
    elements.openPaymentBtn?.addEventListener("click", () => {
        lastFocusedElement = document.activeElement;
        if (elements.paymentModal) {
            elements.paymentModal.style.display = "block";
            elements.paymentModal.querySelector('input')?.focus();
            elements.openPaymentBtn.setAttribute('aria-expanded', 'true');
        }
    });

    const closeModal = () => {
        if (elements.paymentModal) {
            elements.paymentModal.style.display = "none";
            elements.openPaymentBtn?.setAttribute('aria-expanded', 'false');
            lastFocusedElement?.focus();
        }
    };

    elements.closePaymentBtn?.addEventListener("click", closeModal);
    elements.payBtn?.addEventListener("click", () => handlePayment(elements));

    // Global Key Listener (Escape)
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
            toggleMenu(false);
        }
    });

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === elements.paymentModal) closeModal();
    });

    // Handle initial payment status from server
    const status = document.body.dataset.paymentStatus;
    if (status) {
        showNotification(
            status === 'success' ? "Payment Successful! We'll contact you shortly." : "Payment Failed. Please try again.",
            status === 'success' ? 'success' : 'error'
        );
    }
});

/**
 * UI Component: Notifications
 */
function showNotification(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `notification ${type}`;
    div.setAttribute('role', 'status');
    div.innerText = msg;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => div.remove(), 500);
    }, 5000);
}

/**
 * Logic: Contact Form Submission
 */
async function handleContactSubmit(elements) {
    const { contactForm, csrfToken } = elements;
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const responseBox = document.getElementById("response");
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    submitBtn.classList.add('loading');
    if (!submitBtn.querySelector('.loader')) {
        const loader = document.createElement('div');
        loader.className = 'loader';
        submitBtn.appendChild(loader);
    }

    try {
        const resp = await fetch("/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
            body: JSON.stringify(data)
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.status || 'Submission failed');

        // Success State
        const originalHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Message Sent</span> <i class="fas fa-check"></i>';
        submitBtn.classList.remove('loading');
        submitBtn.classList.add('btn-success');

        responseBox.className = 'form-response show success';
        responseBox.innerText = result.status;
        contactForm.reset();
        if (elements.charCounter) elements.charCounter.innerText = "0 / 1000";

        setTimeout(() => {
            submitBtn.innerHTML = originalHTML;
            submitBtn.classList.remove('btn-success');
            responseBox.classList.remove('show');
        }, 5000);

    } catch (err) {
        submitBtn.classList.remove('loading');
        responseBox.className = 'form-response show error';
        responseBox.innerText = "Error: " + err.message;
    }
}

/**
 * Logic: Paystack Payment
 */
async function handlePayment(elements) {
    const { payBtn, csrfToken } = elements;
    const emailInput = document.getElementById("payEmail");
    const email = emailInput?.value;

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

    try {
        const resp = await fetch("/initialize-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
            body: JSON.stringify({ email })
        });
        const data = await resp.json();
        if (data.status) {
            window.location.href = data.data.authorization_url;
        } else {
            throw new Error(data.message || "Initialization failed");
        }
    } catch (err) {
        payBtn.classList.remove('loading');
        payBtn.disabled = false;
        showNotification(err.message, 'error');
    }
}
