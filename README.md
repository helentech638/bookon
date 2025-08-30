# BookOn - White-Label Booking Platform

A scalable, secure booking platform for schools and clubs with integrated payments, attendance management, and communication tools.

## 🚀 Features

- **Embeddable Booking Widget** - Integrate into any school/club website
- **Parent Booking Flow** - 3-step mobile-first booking process
- **Stripe Connect Integration** - Multi-venue marketplace payments
- **Digital Attendance Registers** - Customizable with export capabilities
- **Admin Dashboard** - Complete management interface for schools/clubs
- **Communication System** - Automated emails and messaging
- **Real-time Notifications** - Live updates and alerts
- **GDPR Compliant** - Data protection and privacy features

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 + Redis 7
- **Payments**: Stripe Connect (Standard/Express)
- **Email**: AWS SES / SendGrid
- **Hosting**: AWS (ECS, RDS, ElastiCache, S3, CloudFront)
- **CI/CD**: GitHub Actions
- **Testing**: Jest, Mocha, Cypress

## 📁 Project Structure

```
BookOn/
├── frontend/                 # React application
├── backend/                  # Node.js API
├── shared/                   # Shared utilities
├── docs/                     # Documentation
├── scripts/                  # Build and deployment scripts
├── .github/                  # GitHub Actions workflows
└── docker-compose.yml        # Development environment
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 15
- Redis 7

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BookOn
   ```

2. **Start development environment**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   # Backend (from backend directory)
   npm run dev
   
   # Frontend (from frontend directory)
   npm start
   ```

## 📚 Documentation

- [Development Plan](./PLAN.md)
- [API Documentation](./docs/api-docs.yaml)
- [Admin Guide](./docs/ADMIN_GUIDE.md)
- [Parent Guide](./docs/PARENT_GUIDE.md)
- [Deployment Guide](./docs/DEPLOY.md)

## 🚀 BookOn Embeddable Widget

The BookOn system includes a powerful embeddable widget that can be integrated into any website to provide seamless activity booking functionality. The widget is fully customizable, mobile-responsive, and supports advanced configuration options.

### Quick Start

1. **Include the widget script** in your HTML:
```html
<script src="https://your-domain.com/widget.js"></script>
```

2. **Add the widget container** where you want it to appear:
```html
<div id="bookon-widget" 
     data-theme="light"
     data-primary-color="#00806a"
     data-position="bottom-right"
     data-show-logo="true">
</div>
```

### Configuration Options

The widget supports comprehensive configuration through data attributes:

#### Basic Configuration
- `data-theme`: Widget theme (`light`, `dark`, or `auto`)
- `data-primary-color`: Primary color in hex format (e.g., `#00806a`)
- `data-position`: Widget position (`bottom-right`, `bottom-left`, `top-right`, `top-left`)
- `data-show-logo`: Whether to show the BookOn logo (`true`/`false`)

#### Advanced Configuration
- `data-custom-css`: Custom CSS to override default styles
- `data-activity-id`: Specific activity to book (optional)
- `data-venue-id`: Specific venue to display (optional)

### Advanced Usage

For programmatic control, you can create and manage widgets dynamically:

```javascript
// Create widget programmatically
const widget = new BookOnWidget({
    theme: 'dark',
    primaryColor: '#1f2937',
    position: 'top-right',
    showLogo: false,
    customCSS: '.bookon-widget-toggle { border-radius: 20px; }'
});

// Control widget behavior
widget.show();           // Show the widget
widget.hide();           // Hide the widget
widget.toggleMinimized(); // Toggle minimized state

// Update configuration
widget.updateConfig({
    theme: 'light',
    primaryColor: '#00806a'
});

// Destroy widget when done
widget.destroy();
```

### Event Handling

The widget communicates with your website through custom events:

```javascript
// Listen for widget ready event
document.addEventListener('bookon:widgetReady', (event) => {
    console.log('Widget is ready:', event.detail);
});

// Listen for booking success
document.addEventListener('bookon:bookingSuccess', (event) => {
    console.log('Booking successful:', event.detail);
    // Handle successful booking
});

// Listen for widget errors
document.addEventListener('bookon:widgetError', (event) => {
    console.error('Widget error:', event.detail);
    // Handle widget errors
});
```

### Features

- **🎨 Theme Customization**: Light, dark, or auto themes that adapt to your website
- **📍 Flexible Positioning**: Place widgets in any corner of your website
- **🎯 Custom Colors**: Match your brand with custom primary colors
- **🔧 Custom CSS**: Override default styles with your own CSS
- **📱 Mobile Responsive**: Automatically adapts to mobile devices
- **🔔 Event Handling**: Listen to booking events and success callbacks
- **⚡ Auto-Initialization**: Automatically detects and initializes widgets
- **🔄 Dynamic Updates**: Update widget configuration on the fly
- **🎭 White-Label Ready**: Customize branding and appearance
- **🔒 Secure Payments**: Integrated Stripe Connect for secure payments

### Demo & Examples

- **Live Demo**: [Widget Demo Page](widget-demo.html)
- **Code Examples**: See the demo page for comprehensive examples
- **Integration Guide**: [Widget Integration Guide](docs/widget-integration.md)

### Browser Support

The widget supports all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bookon
REDIS_URL=redis://localhost:6379

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
AWS_SES_ACCESS_KEY_ID=...
AWS_SES_SECRET_ACCESS_KEY=...

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
```

## 📊 Development Phases

- **Phase 1**: Project Setup & Infrastructure (2 weeks) - ✅ Current
- **Phase 2**: Core Features Development (6 weeks)
- **Phase 3**: Admin & Communication Features (4 weeks)
- **Phase 4**: Security, Testing & Compliance (3 weeks)
- **Phase 5**: Deployment & Production (2 weeks)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the development plan in `PLAN.md`

---

**BookOn** - Making school and club bookings simple, secure, and scalable.
