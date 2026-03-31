# Review System Setup Guide

## Overview
A professional review/testimonial system has been integrated into the portfolio website. Website visitors can submit reviews from a modal form integrated into the testimonials section of the home page.

---

## 🎯 Features

✅ **Review Submission Modal** - Beautiful form in the testimonials section  
✅ **Star Rating System** - Interactive 5-star rating selector  
✅ **Form Validation** - Required fields enforcement  
✅ **Email Notifications** - Receive review submissions via email  
✅ **Organized Submissions** - All reviews stored in Formspree dashboard  
✅ **Professional Styling** - Matches premium blue/white design theme  

---

## 📍 Where It's Located

**Home Page → Testimonials Section → Third Card**

The "Submit Review" button appears as the third card in the testimonials section, making it highly visible and accessible.

---

## 🔧 Setup Instructions

### Step 1: Create Formspree Account
1. Visit: https://formspree.io/
2. Click "Sign Up" (free tier available)
3. Create account with your email
4. Verify email address

### Step 2: Create New Form
1. In Formspree dashboard, click "New Form"
2. Name it: "drkc_portfolio_reviews"
3. Set email: your-email@example.com (where reviews will be sent)
4. Click "Create"

### Step 3: Get Form ID
1. After creation, you'll see the form endpoint
2. It looks like: `https://formspree.io/f/xzbbzaob`
3. Copy the ID part: `xzbbzaob`

### Step 4: Update index.html
1. Open `index.html`
2. Find the review form (search for "reviewForm")
3. In the `<form>` tag, update the action:
   ```html
   <form id="reviewForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
4. Replace `YOUR_FORM_ID` with your actual ID from Step 3
5. Save the file

### Step 5: Test Submission
1. Open the website
2. Scroll to testimonials section
3. Click "Submit Review" button
4. Fill out the form
5. Submit
6. Check your email for the submission
7. Review should appear in Formspree dashboard

---

## 📋 Review Form Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| Name | Text | Yes | Reviewer's full name |
| Organization | Text | No | Company/Institution |
| Designation | Text | No | Job title/role |
| Email | Email | Yes | Contact information |
| Rating | Stars (1-5) | Yes | Overall rating |
| Area | Dropdown | Yes | Type of engagement |
| Review | Textarea | Yes | Detailed feedback |
| Consent | Checkbox | Yes | Permission to publish |

---

## ⭐ Rating Categories
- Corporate Training
- Executive Coaching
- Workshop
- Keynote Speaking
- Learning Program
- Other

---

## 🎨 Styling & Customization

### Change button color
In `index.html`, find the Submit Review button class and modify:
```html
<button class="btn-apple mt-auto" data-bs-toggle="modal" data-bs-target="#reviewModal">Submit Review</button>
```

### Change form endpoint
Update the `action` attribute in the form (see Step 4)

### Modify form fields
Edit the form structure and input names as needed

---

## 📧 Email Notifications

### Default Behavior
- Every review submission sends an email to your Formspree-registered email
- Formspree also stores submissions in dashboard

### Managing Submissions
1. Go to Formspree.io dashboard
2. View all submissions in real-time
3. Export submissions as CSV
4. Set up email forwarding (premium feature)

---

## 🔒 Moderation & Publishing

### Option 1: Manual Publishing (Recommended)
1. Review submission in Formspree dashboard
2. Copy approved reviews
3. Manually add to `#submitted-reviews` section in HTML

### Option 2: Automatic Display (Using JavaScript)
To automatically display reviews, you would need a backend service. Contact your developer for:
- PHP backend to fetch and display reviews
- Database integration for storage
- WordPress integration for easy management

### Option 3: WordPress Integration (Future)
Once migrated to WordPress:
1. Install "WPForms" plugin
2. Create review form with same fields
3. Automatically display in testimonials section
4. Admin can approve/reject reviews

---

## 📊 Sample Review JSON Format

```json
{
  "name": "Rajesh Kumar",
  "organization": "Tech Corp",
  "designation": "VP Sales",
  "email": "rajesh@techcorp.com",
  "rating": "5",
  "area": "Corporate Training",
  "review": "Excellent training program with practical insights...",
  "consent": "on"
}
```

---

## 🚀 Advanced Features (Optional)

### Add Review Display Script
Add this to automatically display reviews from a JSON file:

```javascript
// Load submitted reviews
fetch('/reviews.json')
  .then(response => response.json())
  .then(reviews => {
    const container = document.getElementById('submitted-reviews');
    reviews.forEach(review => {
      const card = document.createElement('div');
      card.className = 'col-lg-4';
      card.innerHTML = `
        <div class="testimonial-card apple-card p-5 h-100">
          <div class="d-flex gap-1 mb-4">
            ${Array(review.rating).fill('<i class="fas fa-star text-primary-blue"></i>').join('')}
          </div>
          <p class="fs-6 text-muted mb-4">"${review.review}"</p>
          <div class="d-flex align-items-center gap-3">
            <div>
              <p class="fw-bold mb-0 small">${review.name}</p>
              <p class="small text-muted mb-0">${review.designation}, ${review.organization}</p>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });
```

### Star Display Helper
```javascript
function displayStars(rating) {
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < rating ? '<i class="fas fa-star text-primary-blue"></i>' : '<i class="fas fa-star text-muted"></i>';
  }
  return stars;
}
```

---

## 🔗 Integration Points

### Modal Trigger Buttons
- "Submit Review" in testimonials → `data-bs-target="#reviewModal"`
- Can add more buttons on other pages pointing to same modal

### Form Fields in Script
All field values available in `js/script.js` for custom handling:
- `reviewName` - visitor name
- `reviewRating` - 1-5 star rating
- `reviewArea` - engagement type
- `reviewText` - review content

---

## 📱 Mobile Responsiveness

The review modal is fully responsive:
- **Desktop**: Full-width modal centered
- **Tablet**: Optimized for touch
- **Mobile**: Full-screen mobile-friendly form

---

## ✅ Checklist

- [ ] Create Formspree account
- [ ] Create new form in Formspree
- [ ] Copy form ID
- [ ] Update form action URL in index.html
- [ ] Test review submission
- [ ] Verify email notification received
- [ ] Review in Formspree dashboard
- [ ] Customize form fields if needed
- [ ] Deploy to production

---

## 🆘 Troubleshooting

### Form not submitting
- Check browser console for errors
- Verify Formspree URL is correct
- Check that email is verified in Formspree

### Email not received
- Check spam/junk folder
- Verify email in Formspree settings
- Resend verification email from Formspree

### Stars not working
- Check JavaScript console for errors
- Verify Bootstrap and AOS.js are loaded
- Ensure star elements have correct classes

### Modal not opening
- Check Bootstrap version (must be 5.x)
- Verify modal ID matches button target
- Check browser console for JavaScript errors

---

## 📞 Support Options

1. **Formspree Support**: https://formspree.io/help
2. **Bootstrap Modal Docs**: https://getbootstrap.com/docs/5.0/components/modal/
3. **Custom Backend**: Contact developer for WordPress integration or custom backend solution

---

## 🎯 Next Steps

1. **Immediate**: Set up Formspree (5 minutes)
2. **Short Term**: Start collecting reviews
3. **Medium Term**: Moderate and add best reviews to display
4. **Long Term**: Migrate to WordPress with automatic review management

---

**Setup Date**: March 2026  
**Review System Version**: 1.0  
**Status**: Ready for Production
