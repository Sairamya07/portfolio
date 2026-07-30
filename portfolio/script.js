/**
 * Ramya Tangella Portfolio - Interaction Scripts
 * Implements: Mobile Nav Hamburger, Smooth Offsets, Reveal Transitions, Active Spy Highlight, and Form Interaction
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu drawer when any link is clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // 2. Smooth scrolling with appropriate offset for navbar height
    const navbar = document.querySelector('.navbar');
    document.querySelectorAll('.scroll-link, .nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            // Only perform smooth scroll if linking to internal section
            if (targetId.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const navbarHeight = navbar ? navbar.offsetHeight : 80;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 3. Scroll Reveal Transition Trigger using IntersectionObserver
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target); // Trigger animation once
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // 4. Scroll Spy Active Tab Indicator using IntersectionObserver
    const sections = document.querySelectorAll('section[id]');
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentId = entry.target.getAttribute('id');
                navLinksItems.forEach(link => {
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.35,
        rootMargin: '-80px 0px -25% 0px' // Offset navbar height checking
    });

    sections.forEach(section => {
        spyObserver.observe(section);
    });

    // 5. Contact Form Submission Interactions (Relays to secure Node-Express-Nodemailer backend API)
    const contactForm = document.getElementById('portfolio-contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalText = submitBtn.innerHTML;

            // Gather input fields
            const name = document.getElementById('form-name').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const subject = document.getElementById('form-subject').value.trim();
            const message = document.getElementById('form-message').value.trim();

            // Client-side validation checks
            if (!name) {
                alert("Name is required.");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                alert("A valid email address is required.");
                return;
            }
            if (!message) {
                alert("Message is required.");
                return;
            }

            // Prevent duplicate submissions immediately.
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Sending...</span> <i class="fas fa-spinner fa-spin"></i>';

            // Query or create submission status message element
            let statusMsg = contactForm.querySelector('.contact-status-msg');
            if (!statusMsg) {
                statusMsg = document.createElement('div');
                statusMsg.className = 'contact-status-msg';
                statusMsg.style.fontSize = '0.95rem';
                statusMsg.style.marginTop = '15px';
                statusMsg.style.textAlign = 'center';
                statusMsg.style.transition = 'all 0.3s ease';
                contactForm.appendChild(statusMsg);
            }
            statusMsg.innerHTML = ''; // Reset message

            // Template parameters mapping user input
            const requestData = {
                visitor_name: name,
                visitor_email: email,
                subject: subject || 'No Subject',
                message: message
            };

            // Derive API backend endpoint depending on location context
            const API_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:5000/api/contact'
                : '/api/contact';

            // Dispatch Request to secure Node/Nodemailer backend
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
                .then(async (response) => {
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to send message.');
                    }

                    // Success callback
                    statusMsg.style.color = '#10b981'; // Emerald color matching theme success
                    statusMsg.innerHTML = '<i class="fas fa-check-circle"></i> Thank you! Your message has been sent successfully.';

                    submitBtn.innerHTML = '<span>Message Sent!</span> <i class="fas fa-check"></i>';
                    submitBtn.style.backgroundColor = '#10b981';
                    submitBtn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
                    contactForm.reset();

                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.backgroundColor = '';
                        submitBtn.style.boxShadow = '';
                        statusMsg.innerHTML = '';
                    }, 5000);
                })
                .catch((error) => {
                    console.error("Secure Form API Dispatch Error: ", error);

                    // Error callback
                    statusMsg.style.color = '#ef4444'; // Red alert color
                    statusMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> Failed to send message. ${error.message}`;

                    submitBtn.innerHTML = '<span>Failed!</span> <i class="fas fa-times"></i>';
                    submitBtn.style.backgroundColor = '#ef4444';
                    submitBtn.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';

                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalText;
                        submitBtn.style.backgroundColor = '';
                        submitBtn.style.boxShadow = '';
                    }, 5000);
                });
        });
    }
});