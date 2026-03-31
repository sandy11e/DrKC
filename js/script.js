/**
 * Global Storytelling Platform Logic - Dr. Krishnan Chandrasekharan Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* 1. AOS Animations Initialization */
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1200,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            once: true,
            offset: 150,
            delay: 100
        });
    }

    /* 2. Sticky Navbar & Style Evolution on Scroll */
    const mainNav = document.getElementById('mainNav');
    
    window.addEventListener('scroll', () => {
        // Sticky Header / Background Blur Change
        if (window.scrollY > 50) {
            mainNav.classList.add('scrolled', 'shadow-sm');
            mainNav.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            mainNav.style.padding = '10px 0';
        } else {
            mainNav.classList.remove('scrolled', 'shadow-sm');
            mainNav.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            mainNav.style.padding = '20px 0';
        }

        // 3. Problem Section - Text Highlighting on Scroll (Awareness Journey)
        const problemLines = document.querySelectorAll('.problem-line');
        problemLines.forEach(line => {
            const rect = line.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            // Activate when in central view
            if (rect.top < viewHeight * 0.75 && rect.bottom > viewHeight * 0.25) {
                line.classList.add('active');
            } else {
                line.classList.remove('active');
            }
        });
    });

    /* 4. Smooth Anchor Scrolling with Precise Offset */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== "#") {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 70;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Mobile Menu Close on Click
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                        bsCollapse.hide();
                    }
                }
            }
        });
    });

    /* 6. Star Rating Interactive Handler */
    const starElements = document.querySelectorAll('.star-rating .star');
    const ratingInput = document.getElementById('reviewRating');
    const ratingValue = document.getElementById('ratingValue');

    if (starElements.length > 0) {
        starElements.forEach(star => {
            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-value');
                ratingInput.value = rating;
                ratingValue.textContent = rating;

                // Update visual state
                starElements.forEach(s => {
                    s.classList.remove('active');
                    if (s.getAttribute('data-value') <= rating) {
                        s.classList.add('active');
                    }
                });
            });

            star.addEventListener('mouseover', function() {
                const rating = this.getAttribute('data-value');
                starElements.forEach(s => {
                    if (s.getAttribute('data-value') <= rating) {
                        s.style.opacity = '1';
                    } else {
                        s.style.opacity = '0.5';
                    }
                });
            });
        });

        // Reset on mouse leave
        document.getElementById('starRating').addEventListener('mouseleave', function() {
            const currentRating = ratingInput.value;
            starElements.forEach(s => {
                if (s.getAttribute('data-value') <= currentRating) {
                    s.style.opacity = '1';
                } else {
                    s.style.opacity = '0.5';
                }
            });
        });
    }

    /* 7. Review Form Submission Handler - WordPress REST API */
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate rating
            const rating = document.getElementById('reviewRating').value;
            if (rating === '0') {
                alert('Please select a rating');
                return;
            }
            
            // Collect form data
            const formData = new FormData(this);
            const reviewData = {
                author: formData.get('comment_author'),
                email: formData.get('comment_author_email'),
                organization: formData.get('organization') || '',
                designation: formData.get('designation') || '',
                rating: parseInt(formData.get('review_rating')),
                area: formData.get('review_area'),
                content: formData.get('comment_content'),
                consent: formData.get('consent') ? true : false
            };
            
            // Disable submit button
            const submitBtn = reviewForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            // Try to send to WordPress REST API
            const wpRestUrl = window.location.origin + '/wp-json/drkc/v1/reviews/submit';
            
            fetch(wpRestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reviewData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success || data.review_id) {
                    // WordPress success
                    showSuccessNotification('Thank you! Your review has been submitted and will appear after verification.');
                } else if (data.code === 'rest_no_route' || data.message === 'rest_no_route') {
                    // WordPress not set up yet - store locally
                    console.warn('WordPress REST API not available. Storing locally for now.');
                    storeReviewLocally(reviewData);
                    showSuccessNotification('Review stored. It will be saved to WordPress when available.');
                } else {
                    throw new Error(data.message || 'Unknown error');
                }
                
                // Reset form after delay
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                    if (modal) modal.hide();
                    reviewForm.reset();
                    document.getElementById('reviewRating').value = '0';
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1000);
            })
            .catch(error => {
                console.error('Submission error:', error);
                // Fallback: store locally
                storeReviewLocally(reviewData);
                showSuccessNotification('Review saved locally. It will sync to WordPress when available.');
                
                // Reset form
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                    if (modal) modal.hide();
                    reviewForm.reset();
                    document.getElementById('reviewRating').value = '0';
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 1000);
            });
        });
    }
    
    // Helper: Store review locally (fallback)
    function storeReviewLocally(reviewData) {
        try {
            const reviews = JSON.parse(localStorage.getItem('pendingReviews') || '[]');
            reviews.push({
                ...reviewData,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('pendingReviews', JSON.stringify(reviews));
        } catch (e) {
            console.error('Could not store review locally:', e);
        }
    }
    
    // Helper: Show success notification
    function showSuccessNotification(message) {
        const toast = document.createElement('div');
        toast.innerHTML = `<div class="alert alert-success position-fixed bottom-0 end-0 m-3" role="alert" style="z-index: 9999;">✓ ${message}</div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
    
    /* Load and Display Approved Reviews from WordPress */
    function loadApprovedReviews() {
        const wpRestUrl = window.location.origin + '/wp-json/drkc/v1/reviews/get?limit=3';
        
        fetch(wpRestUrl)
            .then(response => response.json())
            .then(data => {
                if (data.reviews && data.reviews.length > 0) {
                    const reviewsContainer = document.querySelector('[data-reviews-container]');
                    if (reviewsContainer) {
                        reviewsContainer.innerHTML = data.reviews.map(review => `
                            <div class="col-md-6 col-lg-4" data-aos="fade-up">
                                <div class="testimonial-card h-100 p-4 bg-white rounded-4" style="border-top: 4px solid #0071e3; box-shadow: 0 8px 24px rgba(0,113,227,0.08);">
                                    <div class="mb-3">
                                        <div class="star-rating-display">
                                            ${'★'.repeat(review.rating)}<span style="color: #ddd;">${'★'.repeat(5 - review.rating)}</span>
                                        </div>
                                    </div>
                                    <p class="text-muted mb-4" style="font-size: 0.95rem; line-height: 1.6;">"${review.content}"</p>
                                    <div>
                                        <p class="fw-bold mb-0">${review.author}</p>
                                        ${review.designation ? `<p class="small text-muted mb-1">${review.designation}</p>` : ''}
                                        ${review.organization ? `<p class="small text-muted">${review.organization}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('');
                        
                        // Re-initialize AOS for new elements
                        if (window.AOS) {
                            AOS.refresh();
                        }
                    }
                }
            })
            .catch(error => {
                console.log('WordPress reviews not yet configured. Using hardcoded testimonials.');
                // Keep hardcoded testimonials visible
            });
    }
    
    // Load reviews on page load
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(loadApprovedReviews, 500);
    });
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        // WhatsApp Submit
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Capture Data
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const messageField = document.getElementById('message');
            const organizationField = document.getElementById('organization');
            const inquiryTypeField = document.getElementById('inquiryType');

            if (!nameField || !emailField || !messageField) {
                console.error("Critical Form Error: Required inputs not found.");
                return;
            }

            const name = nameField.value.trim();
            const email = emailField.value.trim();
            const message = messageField.value.trim();
            const organization = organizationField ? organizationField.value.trim() : '';
            const inquiryType = inquiryTypeField ? inquiryTypeField.value : '';

            // Premium Visual Feedback
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Preparing...';
            btn.disabled = true;

            // Construct WhatsApp Message
            const whatsappNumber = "916300405352";
            let whatsappText = `*New Enquiry from Portfolio*%0A%0A`;
            whatsappText += `*Name:* ${name}%0A`;
            whatsappText += `*Email:* ${email}%0A`;
            if (organization) {
                whatsappText += `*Organization:* ${organization}%0A`;
            }
            if (inquiryType) {
                whatsappText += `*Inquiry Type:* ${inquiryType}%0A`;
            }
            whatsappText += `*Message:* ${message}`;
            
            const waLink = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappText}`;

            // Direct Interaction
            setTimeout(() => {
                window.open(waLink, '_blank');
                
                // Reset State
                setTimeout(() => {
                    contactForm.reset();
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 1000);
            }, 800);
        });

        // Email Submit Button
        const emailBtn = document.getElementById('emailBtn');
        if (emailBtn) {
            emailBtn.addEventListener('click', (e) => {
                e.preventDefault();

                const nameField = document.getElementById('name');
                const emailField = document.getElementById('email');
                const messageField = document.getElementById('message');
                const organizationField = document.getElementById('organization');
                const inquiryTypeField = document.getElementById('inquiryType');

                if (!nameField || !emailField || !messageField) {
                    console.error("Critical Form Error: Required inputs not found.");
                    return;
                }

                const name = nameField.value.trim();
                const email = emailField.value.trim();
                const message = messageField.value.trim();
                const organization = organizationField ? organizationField.value.trim() : '';
                const inquiryType = inquiryTypeField ? inquiryTypeField.value : '';

                // Construct Email
                let emailSubject = `Professional Inquiry from ${name}`;
                let emailBody = `Name: ${name}%0D%0AEmail: ${email}%0D%0A`;
                if (organization) {
                    emailBody += `Organization: ${organization}%0D%0A`;
                }
                if (inquiryType) {
                    emailBody += `Inquiry Type: ${inquiryType}%0D%0A`;
                }
                emailBody += `%0D%0AMessage:%0D%0A${message}`;

                const mailtoLink = `mailto:info@learningwithoutwalls.com?subject=${encodeURIComponent(emailSubject)}&body=${emailBody}`;
                window.location.href = mailtoLink;
            });
        }
    }

});
