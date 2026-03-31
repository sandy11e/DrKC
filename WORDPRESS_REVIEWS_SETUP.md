# WordPress Reviews System Setup Guide

## Overview
This guide explains how to set up WordPress to store, moderate, and display visitor reviews submitted from your portfolio website.

---

## Phase 1: WordPress Setup (Theme/Plugin)

### Step 1.1 - Create Custom Post Type for Reviews

Add this to your **child theme's `functions.php`** file:

```php
<?php
// Register Reviews Custom Post Type
function drkc_register_reviews_cpt() {
    $args = array(
        'public'              => false,
        'publicly_queryable'  => false,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'menu_icon'           => 'dashicons-format-quote',
        'menu_position'       => 25,
        'supports'            => array( 'title', 'editor', 'custom-fields' ),
        'labels'              => array(
            'name'                  => 'Reviews',
            'singular_name'         => 'Review',
            'add_new'               => 'Add New Review',
            'edit_item'             => 'Edit Review',
        ),
        'show_in_rest'        => true, // Enable REST API
    );
    register_post_type( 'drkc_review', $args );
}
add_action( 'init', 'drkc_register_reviews_cpt' );

// Register Review Meta Fields
function drkc_register_review_meta() {
    $meta_fields = array(
        'review_rating'       => array( 'type' => 'number' ),
        'review_area'         => array( 'type' => 'string' ),
        'review_organization' => array( 'type' => 'string' ),
        'review_designation'  => array( 'type' => 'string' ),
        'review_approved'     => array( 'type' => 'boolean' ),
        'review_featured'     => array( 'type' => 'boolean' ),
    );
    
    foreach ( $meta_fields as $field => $config ) {
        register_meta( 'post', $field, array(
            'object_subtype' => 'drkc_review',
            'type'          => $config['type'],
            'single'        => true,
            'show_in_rest'  => true,
        ));
    }
}
add_action( 'init', 'drkc_register_review_meta' );
?>
```

### Step 1.2 - Create Custom REST Endpoint

Add this to `functions.php`:

```php
<?php
// Custom REST Endpoint: Save Review
function drkc_save_review( $request ) {
    $params = $request->get_json_params();
    
    // Validate required fields
    $required = array( 'author', 'email', 'rating', 'content' );
    foreach ( $required as $field ) {
        if ( empty( $params[ $field ] ) ) {
            return new WP_Error( 'missing_field', "Missing required field: $field", array( 'status' => 400 ) );
        }
    }
    
    // Validate email
    if ( ! is_email( $params['email'] ) ) {
        return new WP_Error( 'invalid_email', 'Invalid email address', array( 'status' => 400 ) );
    }
    
    // Validate rating (1-5)
    $rating = intval( $params['rating'] );
    if ( $rating < 1 || $rating > 5 ) {
        return new WP_Error( 'invalid_rating', 'Rating must be between 1 and 5', array( 'status' => 400 ) );
    }
    
    // Validate content length
    if ( strlen( $params['content'] ) < 20 ) {
        return new WP_Error( 'short_content', 'Review must be at least 20 characters', array( 'status' => 400 ) );
    }
    
    // Check consent
    if ( empty( $params['consent'] ) ) {
        return new WP_Error( 'no_consent', 'Review consent required', array( 'status' => 400 ) );
    }
    
    // Create post
    $post_id = wp_insert_post( array(
        'post_type'   => 'drkc_review',
        'post_status' => 'pending', // Pending moderation
        'post_title'  => sanitize_text_field( $params['author'] ),
        'post_content'=> wp_kses_post( $params['content'] ),
        'post_author' => 1, // Default author
    ));
    
    if ( is_wp_error( $post_id ) ) {
        return $post_id;
    }
    
    // Save meta fields
    update_post_meta( $post_id, 'review_rating', $rating );
    update_post_meta( $post_id, 'review_area', sanitize_text_field( $params['area'] ?? '' ) );
    update_post_meta( $post_id, 'review_organization', sanitize_text_field( $params['organization'] ?? '' ) );
    update_post_meta( $post_id, 'review_designation', sanitize_text_field( $params['designation'] ?? '' ) );
    update_post_meta( $post_id, 'review_approved', false );
    update_post_meta( $post_id, 'review_featured', false );
    
    // Log reviewer email
    update_post_meta( $post_id, '_review_email', sanitize_email( $params['email'] ) );
    
    return new WP_REST_Response( array(
        'success' => true,
        'message' => 'Review submitted successfully. It will appear after moderation.',
        'review_id' => $post_id,
    ), 201 );
}

// Register REST Route
function drkc_register_review_routes() {
    register_rest_route( 'drkc/v1', '/reviews/submit', array(
        'methods'             => 'POST',
        'callback'            => 'drkc_save_review',
        'permission_callback' => '__return_true', // Public access
    ));
}
add_action( 'rest_api_init', 'drkc_register_review_routes' );
?>
```

### Step 1.3 - Get Approved Reviews Endpoint

Add this to `functions.php`:

```php
<?php
// Custom REST Endpoint: Get Approved Reviews
function drkc_get_reviews( $request ) {
    $limit = intval( $request->get_param( 'limit' ) ?? 6 );
    $area = sanitize_text_field( $request->get_param( 'area' ) ?? '' );
    
    $args = array(
        'post_type'      => 'drkc_review',
        'post_status'    => 'publish', // Only published reviews
        'posts_per_page' => $limit,
        'orderby'        => 'meta_value',
        'meta_key'       => 'review_featured',
        'order'          => 'DESC',
    );
    
    // Filter by area if provided
    if ( ! empty( $area ) ) {
        $args['meta_query'] = array(
            array(
                'key'     => 'review_area',
                'value'   => $area,
                'compare' => '=',
            ),
        );
    }
    
    $query = new WP_Query( $args );
    
    $reviews = array();
    foreach ( $query->posts as $post ) {
        $reviews[] = array(
            'id'           => $post->ID,
            'author'       => get_the_title( $post->ID ),
            'content'      => $post->post_content,
            'rating'       => intval( get_post_meta( $post->ID, 'review_rating', true ) ),
            'area'         => get_post_meta( $post->ID, 'review_area', true ),
            'organization' => get_post_meta( $post->ID, 'review_organization', true ),
            'designation'  => get_post_meta( $post->ID, 'review_designation', true ),
            'featured'     => get_post_meta( $post->ID, 'review_featured', true ),
            'date'         => $post->post_date,
        );
    }
    
    return new WP_REST_Response( array(
        'success' => true,
        'count'   => count( $reviews ),
        'reviews' => $reviews,
    ), 200 );
}

// Register GET Reviews Route
add_action( 'rest_api_init', function() {
    register_rest_route( 'drkc/v1', '/reviews/get', array(
        'methods'             => 'GET',
        'callback'            => 'drkc_get_reviews',
        'permission_callback' => '__return_true',
    ));
});
?>
```

---

## Phase 2: Frontend Integration

### Step 2.1 - Update JavaScript

Replace the review form submission handler in `js/script.js`:

```javascript
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
            organization: formData.get('organization'),
            designation: formData.get('designation'),
            rating: formData.get('review_rating'),
            area: formData.get('review_area'),
            content: formData.get('comment_content'),
            consent: formData.get('consent') ? true : false
        };
        
        // Disable submit button
        const submitBtn = reviewForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Send to WordPress REST API
        fetch('/wp-json/drkc/v1/reviews/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success || data.review_id) {
                // Show success message
                const toast = document.createElement('div');
                toast.innerHTML = '<div class="alert alert-success position-fixed bottom-0 end-0 m-3" role="alert" style="z-index: 9999;">✓ Thank you! Your review has been submitted and will appear after verification.</div>';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
                
                // Reset and close modal
                setTimeout(() => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
                    if (modal) modal.hide();
                    reviewForm.reset();
                    document.getElementById('reviewRating').value = '0';
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 500);
            } else {
                alert('Error: ' + (data.message || 'Could not submit review'));
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error submitting review. Please try again.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
    });
}

/* Load and Display Approved Reviews */
function loadApprovedReviews() {
    fetch('/wp-json/drkc/v1/reviews/get?limit=3')
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
                                <p class="text-muted mb-4">"${review.content}"</p>
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
        .catch(error => console.log('Reviews loaded from testimonials section'));
}

// Load reviews on page load
document.addEventListener('DOMContentLoaded', loadApprovedReviews);
```

### Step 2.2 - Update HTML Container

Update the testimonials section in `index.html` to include a reviews container:

```html
<section class="section-padding" id="testimonials">
    <div class="container apple-container">
        <h2 class="display-2 fw-bold text-center mb-5">What Professionals Say</h2>
        
        <div class="row" data-reviews-container>
            <!-- Reviews loaded dynamically from WordPress -->
            <!-- Fallback testimonials -->
            <div class="col-md-6 col-lg-4" data-aos="fade-up">
                <div class="testimonial-card h-100 p-4 bg-white rounded-4">
                    <p class="text-muted mb-4">"Loading testimonials..."</p>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-5">
            <button class="btn-apple" data-bs-toggle="modal" data-bs-target="#reviewModal">
                Share Your Experience
            </button>
        </div>
    </div>
</section>
```

---

## Phase 3: Moderation in WordPress Admin

### Step 3.1 - Review Moderation Workflow

1. **Navigate to**: Admin → Reviews
2. **Review List Shows**:
   - Reviewer name
   - Rating (1-5 stars)
   - Area of engagement
   - Organization & designation
   - Status (Pending/Published)

3. **To Approve a Review**:
   - Click on review
   - Click "Publish"
   - Review now appears on homepage

4. **To Feature a Review** (shows first):
   - Edit review
   - Find "Featured" checkbox in Custom Fields
   - Check it and save
   - This review appears first in the testimonials section

### Step 3.2 - Admin Columns

Add this to `functions.php` for better admin UX:

```php
<?php
// Add custom columns to Reviews list
function drkc_reviews_admin_columns( $columns ) {
    $new_columns = array(
        'cb'              => $columns['cb'],
        'title'           => 'Reviewer',
        'rating'          => 'Rating',
        'area'            => 'Area',
        'organization'    => 'Organization',
        'review_content'  => 'Review',
        'date'            => $columns['date'],
    );
    return $new_columns;
}
add_filter( 'manage_drkc_review_posts_columns', 'drkc_reviews_admin_columns' );

// Display custom column data
function drkc_reviews_admin_column_data( $column, $post_id ) {
    switch ( $column ) {
        case 'rating':
            $rating = get_post_meta( $post_id, 'review_rating', true );
            echo '★ ' . $rating . '/5';
            break;
        case 'area':
            echo get_post_meta( $post_id, 'review_area', true );
            break;
        case 'organization':
            echo get_post_meta( $post_id, 'review_organization', true );
            break;
        case 'review_content':
            $content = get_the_content( null, false, $post_id );
            echo wp_trim_words( $content, 15 );
            break;
    }
}
add_action( 'manage_drkc_review_posts_custom_column', 'drkc_reviews_admin_column_data', 10, 2 );
?>
```

---

## Phase 4: Testing

### Test Submission Flow

1. Open your portfolio website
2. Click "Share Your Experience" button
3. Fill form with test data
4. Submit review
5. Check WordPress Admin → Reviews
6. See review in "Pending" status
7. Publish it
8. Refresh website homepage
9. See review appear in Testimonials section ✓

### Expected Response

**Success:**
```json
{
  "success": true,
  "message": "Review submitted successfully. It will appear after moderation.",
  "review_id": 42
}
```

**Error (missing field):**
```json
{
  "code": "missing_field",
  "message": "Missing required field: rating"
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Reviews not saving | Check WordPress REST API is enabled in settings |
| Endpoint 404 | Verify `functions.php` code added correctly, reload permalinks (Settings → Permalinks → Save) |
| CORS errors | Add CORS headers if frontend is on different domain |
| Reviews not displaying | Check if reviews are "Published", not "Pending" |
| Rating not saving | Verify `review_rating` meta field is registered |

---

## API Reference

### Submit Review
**Endpoint:** `POST /wp-json/drkc/v1/reviews/submit`

**Payload:**
```json
{
  "author": "John Doe",
  "email": "john@example.com",
  "organization": "Acme Corp",
  "designation": "CEO",
  "rating": 5,
  "area": "Executive Coaching",
  "content": "Dr. Krishnan's coaching transformed our leadership approach...",
  "consent": true
}
```

### Get Reviews
**Endpoint:** `GET /wp-json/drkc/v1/reviews/get?limit=6&area=Executive%20Coaching`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "reviews": [
    {
      "id": 42,
      "author": "John Doe",
      "content": "...",
      "rating": 5,
      "area": "Executive Coaching",
      "organization": "Acme Corp",
      "designation": "CEO",
      "featured": true,
      "date": "2026-03-31 10:30:00"
    }
  ]
}
```

---

## Next Steps

1. ✅ Copy code from Phase 1 to your WordPress theme `functions.php`
2. ✅ Go to WordPress Admin → Permalinks → Save (to refresh REST routes)
3. ✅ Copy code from Phase 2 to `js/script.js`
4. ✅ Update `index.html` testimonials section with `data-reviews-container`
5. ✅ Test review submission on your website
6. ✅ Approve reviews in WordPress Admin → Reviews
7. ✅ Watch them appear on homepage!

