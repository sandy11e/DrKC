# WordPress Migration Guide
## Converting Dr. Krishnan Chandrasekharan Portfolio to WordPress Theme

This guide will help you convert the static HTML portfolio into a fully managed WordPress theme with CMS capabilities for photo gallery, video gallery, and blog management.

---

## 📋 Phase 1: WordPress Theme Setup

### 1.1 Create Theme Structure
```
wp-content/themes/drkc-portfolio/
├── style.css
├── functions.php
├── index.php
├── header.php
├── footer.php
├── page.php
├── single.php
├── front-page.php
├── page-about.php
├── page-gallery.php
├── page-video-gallery.php
├── page-blog.php
├── page-contact.php
├── archive.php
├── inc/
│   ├── custom-post-types.php
│   ├── custom-fields.php
│   └── theme-setup.php
├── css/
│   └── style.css
├── js/
│   └── script.js
└── images/
    └── screenshot.png
```

### 1.2 Create style.css (Theme Header)
```css
/*
Theme Name: Dr. Krishnan Chandrasekharan Portfolio
Theme URI: http://drkc.org
Description: Premium leadership & learning transformation portfolio website
Version: 1.0.0
Author: Your Name
Author URI: http://yourwebsite.com
License: GPL v3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.html
Text Domain: drkc-portfolio
Domain Path: /languages
*/
```

### 1.3 Create functions.php
```php
<?php
/**
 * DRKC Portfolio Theme Functions
 */

// Add theme support
add_theme_support( 'title-tag' );
add_theme_support( 'post-thumbnails' );
add_theme_support( 'menus' );

// Register image sizes
add_image_size( 'hero', 1920, 1080, true );
add_image_size( 'gallery-item', 800, 600, true );
add_image_size( 'blog-thumb', 600, 400, true );

// Register menus
register_nav_menus( array(
    'primary' => 'Primary Navigation',
    'footer'  => 'Footer Navigation'
) );

// Enqueue scripts and styles
function drkc_enqueue_assets() {
    wp_enqueue_style( 'bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css' );
    wp_enqueue_style( 'google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@500;700;800&display=swap' );
    wp_enqueue_style( 'fontawesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css' );
    wp_enqueue_style( 'aos', 'https://unpkg.com/aos@2.3.1/dist/aos.css' );
    wp_enqueue_style( 'drkc-style', get_stylesheet_uri() );

    wp_enqueue_script( 'bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js', array(), null, true );
    wp_enqueue_script( 'aos', 'https://unpkg.com/aos@2.3.1/dist/aos.js', array(), null, true );
    wp_enqueue_script( 'drkc-script', get_template_directory_uri() . '/js/script.js', array(), null, true );
}
add_action( 'wp_enqueue_scripts', 'drkc_enqueue_assets' );

// Include custom post types and fields
require_once get_template_directory() . '/inc/custom-post-types.php';
require_once get_template_directory() . '/inc/custom-fields.php';
```

---

## 🖼️ Phase 2: Gallery Management (Photo Gallery)

### 2.1 Create Custom Post Type for Gallery

**File: inc/custom-post-types.php**
```php
<?php
// Register Gallery Post Type
add_action( 'init', function() {
    register_post_type( 'gallery_item', array(
        'label' => 'Gallery Items',
        'public' => true,
        'show_in_rest' => true,
        'supports' => array( 'title', 'thumbnail' ),
        'menu_icon' => 'dashicons-format-gallery',
    ) );

    // Add Gallery Category Taxonomy
    register_taxonomy( 'gallery_category', 'gallery_item', array(
        'label' => 'Gallery Categories',
        'show_in_rest' => true,
        'hierarchical' => true,
    ) );
});
?>
```

### 2.2 Create Gallery Template

**File: page-gallery.php**
```php
<?php get_header(); ?>

<section class="section-padding">
    <div class="container apple-container">
        <h1 class="display-3 fw-bold mb-5"><?php the_title(); ?></h1>
        
        <div class="row g-4">
            <?php
            $args = array(
                'post_type' => 'gallery_item',
                'posts_per_page' => -1
            );
            $gallery_query = new WP_Query( $args );
            
            if ( $gallery_query->have_posts() ) {
                while ( $gallery_query->have_posts() ) {
                    $gallery_query->the_post();
                    ?>
                    <div class="col-lg-4 col-md-6">
                        <div class="apple-card p-0 overflow-hidden border">
                            <a href="<?php the_post_thumbnail_url( 'full' ); ?>" data-lightbox="gallery">
                                <?php the_post_thumbnail( 'gallery-item', array( 'class' => 'img-fluid' ) ); ?>
                            </a>
                        </div>
                    </div>
                    <?php
                }
                wp_reset_postdata();
            }
            ?>
        </div>
    </div>
</section>

<?php get_footer(); ?>
```

---

## 🎥 Phase 3: Video Gallery Management

### 3.1 Create Custom Post Type for Videos

**File: inc/custom-post-types.php** (Add to existing)
```php
<?php
// Register Video Post Type
add_action( 'init', function() {
    register_post_type( 'video', array(
        'label' => 'Videos',
        'public' => true,
        'show_in_rest' => true,
        'supports' => array( 'title', 'editor' ),
        'menu_icon' => 'dashicons-video-alt',
    ) );

    // Add Video Category Taxonomy
    register_taxonomy( 'video_category', 'video', array(
        'label' => 'Video Categories',
        'show_in_rest' => true,
        'hierarchical' => true,
    ) );
});
?>
```

### 3.2 Add Meta Fields for YouTube URL

**File: inc/custom-fields.php**
```php
<?php
// Register Meta Fields for Videos
add_action( 'add_meta_boxes', function() {
    add_meta_box(
        'video_url_meta',
        'YouTube Video URL',
        function() {
            global $post;
            $video_url = get_post_meta( $post->ID, 'video_url', true );
            ?>
            <label for="video_url">Video URL (YouTube Embed URL):</label>
            <input type="url" id="video_url" name="video_url" value="<?php echo esc_attr( $video_url ); ?>" style="width: 100%; padding: 8px;">
            <?php
        },
        'video'
    );
});

// Save Meta Fields
add_action( 'save_post_video', function( $post_id ) {
    if ( isset( $_POST['video_url'] ) ) {
        update_post_meta( $post_id, 'video_url', sanitize_url( $_POST['video_url'] ) );
    }
});
?>
```

### 3.3 Create Video Gallery Template

**File: page-video-gallery.php**
```php
<?php get_header(); ?>

<section class="section-padding">
    <div class="container apple-container">
        <h1 class="display-3 fw-bold mb-5"><?php the_title(); ?></h1>
        
        <div class="row g-5">
            <?php
            $args = array(
                'post_type' => 'video',
                'posts_per_page' => -1
            );
            $video_query = new WP_Query( $args );
            
            if ( $video_query->have_posts() ) {
                while ( $video_query->have_posts() ) {
                    $video_query->the_post();
                    $video_url = get_post_meta( get_the_ID(), 'video_url', true );
                    ?>
                    <div class="col-lg-6">
                        <div class="apple-card p-4">
                            <div class="ratio ratio-16x9 rounded-4 overflow-hidden shadow-lg border">
                                <iframe src="<?php echo esc_url( $video_url ); ?>" title="<?php the_title(); ?>" allowfullscreen></iframe>
                            </div>
                            <div class="mt-4">
                                <h4 class="fw-bold"><?php the_title(); ?></h4>
                                <p class="text-muted"><?php the_content(); ?></p>
                            </div>
                        </div>
                    </div>
                    <?php
                }
                wp_reset_postdata();
            }
            ?>
        </div>
    </div>
</section>

<?php get_footer(); ?>
```

---

## 📝 Phase 4: Blog Management

### 4.1 Blog Template

**File: archive.php**
```php
<?php get_header(); ?>

<header class="section-padding bg-light" style="margin-top: 80px;">
    <div class="container apple-container">
        <h1 class="display-3 fw-bold"><?php the_archive_title(); ?></h1>
        <p class="lead opacity-75 mt-3"><?php the_archive_description(); ?></p>
    </div>
</header>

<section class="section-padding">
    <div class="container apple-container">
        <div class="row g-5">
            <?php
            if ( have_posts() ) {
                while ( have_posts() ) {
                    the_post();
                    ?>
                    <div class="col-lg-4">
                        <div class="apple-card h-100">
                            <?php if ( has_post_thumbnail() ) { ?>
                                <div class="mb-4">
                                    <?php the_post_thumbnail( 'blog-thumb', array( 'class' => 'img-fluid rounded-4' ) ); ?>
                                </div>
                            <?php } ?>
                            
                            <span class="text-primary-blue small fw-bold text-uppercase tracking-widest">
                                <?php the_category( ', ' ); ?>
                            </span>
                            <h4 class="fw-bold mt-2"><?php the_title(); ?></h4>
                            <p class="text-muted small"><?php echo wp_trim_words( get_the_excerpt(), 20 ); ?></p>
                            <a href="<?php the_permalink(); ?>" class="btn-apple-outline mt-3 py-2 px-4 small">Read More</a>
                        </div>
                    </div>
                    <?php
                }
                wp_reset_postdata();
            }
            ?>
        </div>
        
        <!-- Pagination -->
        <div class="text-center mt-5">
            <?php echo paginate_links(); ?>
        </div>
    </div>
</section>

<?php get_footer(); ?>
```

### 4.2 Single Blog Post Template

**File: single.php**
```php
<?php get_header(); ?>

<article class="section-padding">
    <div class="container apple-container">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <?php if ( have_posts() ) {
                    while ( have_posts() ) {
                        the_post();
                        ?>
                        <h1 class="display-3 fw-bold mb-4"><?php the_title(); ?></h1>
                        <div class="mb-5">
                            <span class="text-primary-blue small fw-bold">
                                Published: <?php echo get_the_date( 'F j, Y' ); ?>
                            </span>
                        </div>
                        
                        <?php if ( has_post_thumbnail() ) { ?>
                            <div class="mb-5">
                                <?php the_post_thumbnail( 'hero', array( 'class' => 'img-fluid rounded-4' ) ); ?>
                            </div>
                        <?php } ?>
                        
                        <div class="bio-text fs-6 text-muted">
                            <?php the_content(); ?>
                        </div>
                        <?php
                    }
                } ?>
                
                <!-- Related Posts -->
                <div class="mt-5 pt-5 border-top">
                    <h4 class="fw-bold mb-4">Related Articles</h4>
                    <div class="row g-4">
                        <?php
                        $related = new WP_Query( array(
                            'posts_per_page' => 3,
                            'post__not_in' => array( get_the_ID() ),
                            'orderby' => 'date',
                        ) );
                        
                        if ( $related->have_posts() ) {
                            while ( $related->have_posts() ) {
                                $related->the_post();
                                ?>
                                <div class="col-md-4">
                                    <div class="apple-card h-100">
                                        <h6 class="fw-bold"><?php the_title(); ?></h6>
                                        <p class="small text-muted mb-3"><?php echo wp_trim_words( get_the_excerpt(), 15 ); ?></p>
                                        <a href="<?php the_permalink(); ?>" class="btn-apple-outline small py-2 px-3">Read</a>
                                    </div>
                                </div>
                                <?php
                            }
                            wp_reset_postdata();
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</article>

<?php get_footer(); ?>
```

---

## 📄 Phase 5: Static Pages with Page Builder

### 5.1 Front Page (Home)

**File: front-page.php**

The homepage should use WordPress Theme customizer or page builders like:
- **Elementor** (Recommended - drag & drop with premium free tier)
- **Beaver Builder**
- **Gutenberg Block Editor** (Native, free)

**Using Gutenberg Blocks Approach:**

```php
<?php get_header(); ?>

<div class="site-content">
    <?php the_content(); ?>
</div>

<?php get_footer(); ?>
```

Then create the home page content using:
1. Hero block
2. Paragraph blocks
3. Image blocks
4. Custom CTA blocks

---

## 🎛️ Phase 6: Contact Form Management

### 6.1 Use Contact Form 7 or WPForms

Install via WordPress plugins:
1. **Contact Form 7** (Free, customizable)
2. **WPForms** (User-friendly)
3. **Ninja Forms** (Feature-rich)

**Example with Contact Form 7:**

```php
<?php echo do_shortcode( '[contact-form-7 id="1" title="Contact Form"]' ); ?>
```

**Contact Form 7 Integration with WhatsApp:**

Create custom code in `functions.php`:
```php
add_action( 'wpcf7_before_send_mail', function( $contact_form ) {
    $submission = WPCF7_Submission::get_instance();
    if ( ! $submission ) {
        return;
    }
    
    $formdata = $submission->get_posted_data();
    $whatsapp_number = "916300405352";
    $message = urlencode( "Name: " . $formdata['your-name'] . "\nMessage: " . $formdata['your-message'] );
    $whatsapp_url = "https://api.whatsapp.com/send?phone=" . $whatsapp_number . "&text=" . $message;
    
    // Log or send notification
});
```

---

## 🗄️ Phase 7: SEO & Performance Optimization

### 7.1 Recommended Plugins

1. **Yoast SEO** - On-page SEO optimization
2. **Rank Math** - AI-powered SEO suite
3. **WP Rocket** - Caching & performance
4. **Smush** - Image optimization
5. **Wordfence** - Security

### 7.2 Theme Customizer Settings

```php
// In functions.php or customizer.php
add_action( 'customize_register', function( $wp_customize ) {
    $wp_customize->add_setting( 'site_tagline' );
    $wp_customize->add_control( 'site_tagline', array(
        'label' => 'Site Tagline',
        'section' => 'title_tagline',
        'type' => 'text',
    ) );
});
```

---

## 📱 Phase 8: Responsive & Mobile Optimization

Ensure all templates use Bootstrap 5 grid:
```php
<div class="container apple-container">
    <div class="row g-5">
        <div class="col-lg-6 col-md-12">Content</div>
    </div>
</div>
```

---

## 🚀 Deployment Checklist

- [ ] Install WordPress theme framework (Underscores or generate)
- [ ] Convert HTML to PHP templates
- [ ] Register custom post types
- [ ] Set up taxonomies
- [ ] Add image sizes
- [ ] Create admin settings
- [ ] Add footer widgets
- [ ] Configure menus
- [ ] Set permalink structure
- [ ] Install required plugins
- [ ] Configure SEO settings
- [ ] Test all pages
- [ ] Set up backups
- [ ] Enable SSL/HTTPS
- [ ] Optimize images
- [ ] Test contact forms
- [ ] Mobile responsiveness check

---

## 📞 Quick Reference: Key URLs

- **WordPress Admin**: `http://yoursite.com/wp-admin`
- **Gallery Management**: Dashboard > Gallery Items
- **Video Management**: Dashboard > Videos
- **Blog Management**: Dashboard > Posts
- **Theme Customizer**: Dashboard > Appearance > Customize
- **Plugins**: Dashboard > Plugins

---

## 🎓 Learning Resources

- [WordPress Theme Development](https://developer.wordpress.org/themes/)
- [WordPress Plugin API](https://developer.wordpress.org/plugins/)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [Elementor Tutorial](https://elementor.com/help/)

---

**Last Updated:** March 2026  
**Theme Version:** 1.0.0  
**Author:** Dr. Krishnan Chandrasekharan
