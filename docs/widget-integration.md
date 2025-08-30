# BookOn Widget Integration Guide

This guide provides comprehensive information for integrating the BookOn embeddable widget into your website or application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Integration](#basic-integration)
3. [Advanced Configuration](#advanced-configuration)
4. [Event Handling](#event-handling)
5. [API Reference](#api-reference)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Quick Start

### 1. Include the Widget Script

Add the BookOn widget script to your HTML `<head>` section:

```html
<script src="https://your-domain.com/widget.js"></script>
```

### 2. Add the Widget Container

Place the widget container where you want it to appear on your page:

```html
<div id="bookon-widget" 
     data-theme="light"
     data-primary-color="#00806a"
     data-position="bottom-right"
     data-show-logo="true">
</div>
```

### 3. That's It!

The widget will automatically initialize and display on your page. Users can click the widget to open the booking interface.

## Basic Integration

### Minimal Configuration

The simplest integration requires only the script and container:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
    <script src="https://your-domain.com/widget.js"></script>
</head>
<body>
    <h1>Welcome to My Website</h1>
    <p>Book activities using the widget below!</p>
    
    <div id="bookon-widget"></div>
</body>
</html>
```

### Basic Configuration

Add basic customization with data attributes:

```html
<div id="bookon-widget" 
     data-theme="dark"
     data-primary-color="#3b82f6"
     data-position="bottom-left"
     data-show-logo="false">
</div>
```

## Advanced Configuration

### Theme Options

Choose from three theme options:

```html
<!-- Light theme (default) -->
<div id="bookon-widget" data-theme="light"></div>

<!-- Dark theme -->
<div id="bookon-widget" data-theme="dark"></div>

<!-- Auto theme (follows website's color scheme) -->
<div id="bookon-widget" data-theme="auto"></div>
```

### Position Options

Place the widget in any corner of your page:

```html
<!-- Bottom right (default) -->
<div id="bookon-widget" data-position="bottom-right"></div>

<!-- Bottom left -->
<div id="bookon-widget" data-position="bottom-left"></div>

<!-- Top right -->
<div id="bookon-widget" data-position="top-right"></div>

<!-- Top left -->
<div id="bookon-widget" data-position="top-left"></div>
```

### Color Customization

Customize the widget's primary color to match your brand:

```html
<div id="bookon-widget" data-primary-color="#ff6b6b"></div>
<div id="bookon-widget" data-primary-color="#4ecdc4"></div>
<div id="bookon-widget" data-primary-color="#45b7d1"></div>
```

### Logo Display

Control whether the BookOn logo appears:

```html
<!-- Show logo (default) -->
<div id="bookon-widget" data-show-logo="true"></div>

<!-- Hide logo -->
<div id="bookon-widget" data-show-logo="false"></div>
```

### Custom CSS

Override default styles with custom CSS:

```html
<div id="bookon-widget" 
     data-custom-css="
       .bookon-widget-toggle {
         border-radius: 20px !important;
         box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
       }
       .bookon-widget-iframe {
         border-radius: 20px !important;
         box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
       }
     ">
</div>
```

## Event Handling

### Widget Ready Event

Listen for when the widget is ready for interaction:

```javascript
document.addEventListener('bookon:widgetReady', (event) => {
    console.log('Widget is ready:', event.detail);
    // Widget is now fully loaded and ready
});
```

### Booking Success Event

Handle successful bookings:

```javascript
document.addEventListener('bookon:bookingSuccess', (event) => {
    console.log('Booking successful:', event.detail);
    
    // Access booking details
    const { bookingId, amount, activity, child } = event.detail;
    
    // Update your UI or analytics
    updateBookingCount();
    trackConversion(amount);
    
    // Show success message
    showSuccessMessage('Booking confirmed!');
});
```

### Widget Error Event

Handle widget errors:

```javascript
document.addEventListener('bookon:widgetError', (event) => {
    console.error('Widget error:', event.detail);
    
    // Log error for debugging
    logError(event.detail);
    
    // Show user-friendly error message
    showErrorMessage('Unable to load booking widget. Please try again.');
});
```

### Widget Closed Event

Detect when users close the widget:

```javascript
document.addEventListener('bookon:widgetClosed', (event) => {
    console.log('Widget was closed');
    
    // Track user behavior
    trackEvent('widget_closed');
    
    // Maybe show a follow-up message
    setTimeout(() => {
        showFollowUpMessage();
    }, 2000);
});
```

## API Reference

### BookOnWidget Constructor

Create widgets programmatically:

```javascript
const widget = new BookOnWidget({
    theme: 'dark',
    primaryColor: '#1f2937',
    position: 'top-right',
    showLogo: false,
    customCSS: '.bookon-widget-toggle { border-radius: 20px; }'
});
```

### Widget Methods

#### show()
Display the widget:

```javascript
widget.show();
```

#### hide()
Hide the widget:

```javascript
widget.hide();
```

#### toggleMinimized()
Toggle between minimized and expanded states:

```javascript
widget.toggleMinimized();
```

#### updateConfig(newConfig)
Update widget configuration:

```javascript
widget.updateConfig({
    theme: 'light',
    primaryColor: '#00806a'
});
```

#### destroy()
Remove the widget from the page:

```javascript
widget.destroy();
```

### Global Functions

#### initBookOnWidget(config)
Alternative way to create widgets:

```javascript
const widget = window.initBookOnWidget({
    theme: 'light',
    primaryColor: '#00806a'
});
```

## Customization

### Styling the Toggle Button

Customize the widget's toggle button:

```css
/* Custom toggle button styles */
.bookon-widget-toggle {
    border-radius: 20px !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
    transition: all 0.3s ease !important;
}

.bookon-widget-toggle:hover {
    transform: scale(1.1) !important;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3) !important;
}
```

### Styling the Widget Container

Customize the widget's iframe container:

```css
/* Custom widget container styles */
.bookon-widget-iframe {
    border-radius: 20px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    border: 2px solid #e5e7eb !important;
}
```

### Responsive Design

Ensure the widget works well on mobile devices:

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
    .bookon-widget-iframe {
        width: 100vw !important;
        height: 100vh !important;
        border-radius: 0 !important;
    }
    
    .bookon-widget-container {
        bottom: 0 !important;
        right: 0 !important;
        left: 0 !important;
        top: 0 !important;
    }
}
```

## Troubleshooting

### Common Issues

#### Widget Not Appearing

1. **Check browser console** for JavaScript errors
2. **Verify script URL** is correct and accessible
3. **Ensure container element** exists in the DOM
4. **Check for CSS conflicts** that might hide the widget

#### Styling Conflicts

1. **Use `!important`** in custom CSS to override conflicts
2. **Check z-index** values for layering issues
3. **Verify CSS specificity** isn't being overridden
4. **Test in incognito mode** to rule out browser extensions

#### Mobile Issues

1. **Check viewport meta tag** is set correctly
2. **Verify touch events** are working
3. **Test on actual devices** not just browser dev tools
4. **Check for mobile-specific CSS** conflicts

#### Event Listeners Not Working

1. **Ensure events are added** after DOM is ready
2. **Check event names** match exactly (case-sensitive)
3. **Verify event listener syntax** is correct
4. **Test with console.log** to confirm events are firing

### Debug Mode

Enable debug mode for troubleshooting:

```javascript
// Enable debug logging
window.BookOnWidgetDebug = true;

// Create widget with debug info
const widget = new BookOnWidget({
    theme: 'light',
    primaryColor: '#00806a'
});

// Check widget state
console.log('Widget state:', widget);
```

## Best Practices

### Performance

1. **Load script asynchronously** to avoid blocking page render
2. **Use CDN** for faster script delivery
3. **Minimize custom CSS** to reduce parsing time
4. **Lazy load widgets** for better initial page performance

### User Experience

1. **Position widgets thoughtfully** to avoid interfering with content
2. **Use appropriate themes** that match your website's design
3. **Test on multiple devices** to ensure consistent experience
4. **Provide clear call-to-action** for widget interaction

### Security

1. **Use HTTPS** for all widget communications
2. **Validate configuration** before applying to widgets
3. **Sanitize custom CSS** to prevent XSS attacks
4. **Monitor widget usage** for suspicious activity

### Accessibility

1. **Ensure keyboard navigation** works with widgets
2. **Provide screen reader support** for widget content
3. **Use appropriate ARIA labels** for interactive elements
4. **Test with accessibility tools** to verify compliance

### SEO

1. **Widgets don't affect** your page's SEO
2. **Content is loaded** in iframe (isolated from main page)
3. **No duplicate content** issues
4. **Page load speed** is minimally impacted

## Examples

### E-commerce Integration

```html
<!-- Product page with booking widget -->
<div class="product-details">
    <h1>Swimming Lessons</h1>
    <p>Book swimming lessons for your child</p>
    
    <!-- BookOn Widget -->
    <div id="bookon-widget" 
         data-theme="light"
         data-primary-color="#10b981"
         data-position="bottom-right"
         data-show-logo="true">
    </div>
</div>
```

### School Website Integration

```html
<!-- School activities page -->
<div class="activities-section">
    <h2>After-School Activities</h2>
    
    <!-- BookOn Widget for activities -->
    <div id="bookon-widget" 
         data-theme="auto"
         data-primary-color="#3b82f6"
         data-position="bottom-left"
         data-show-logo="false">
    </div>
</div>
```

### Sports Club Integration

```html
<!-- Club membership page -->
<div class="membership-options">
    <h2>Join Our Club</h2>
    
    <!-- BookOn Widget for memberships -->
    <div id="bookon-widget" 
         data-theme="dark"
         data-primary-color="#ef4444"
         data-position="top-right"
         data-show-logo="true">
    </div>
</div>
```

## Support

### Documentation

- **API Reference**: [Widget API Documentation](api-reference.md)
- **Examples**: [Widget Examples Gallery](examples.md)
- **Tutorials**: [Integration Tutorials](tutorials.md)

### Technical Support

- **Email**: support@bookon.com
- **Documentation**: docs.bookon.com
- **Community**: community.bookon.com
- **GitHub Issues**: github.com/bookon/widget-issues

### Getting Help

1. **Check documentation** first for common solutions
2. **Search existing issues** for similar problems
3. **Create detailed issue** with reproduction steps
4. **Include browser/device** information in bug reports

---

**BookOn Widget** - Making activity booking seamless and beautiful on any website.
