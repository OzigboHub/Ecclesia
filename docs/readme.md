# Ecclesia Digital Parish Manager (DPM)

## Overview

Ecclesia DPM is a comprehensive parish management system designed specifically for Catholic ecclesiastical structures. It provides a robust platform for managing parishes, outstations, parishioners, sacramental records, donations, mass intentions, appointments, and live streaming services.

## Key Features

### Configurable Feature System
- **Per-Parish Feature Toggles**: Enable or disable features based on each parish's specific needs
- **Flexible Configuration**: Turn on/off features like live streaming, online payments, SMS notifications
- **Scalable Adoption**: Start with basic features and enable advanced ones as needed
- **Cost Optimization**: Only pay for features you actually use

### Parish & Outstation Management
- Hierarchical organization structure
- Multi-parish support with soft multi-tenancy
- Outstation management under parent parishes

### Member & Parishioner Management
- Comprehensive parishioner profiles
- Sacramental record tracking (Baptism, Confirmation, Marriage, etc.)
- Pious organization membership management (CWO, CMO, CYON, etc.)

### Financial Management
- **Advanced Payment System**: Unified payment recording for all financial transactions
- **Multiple Payment Types**: Offerings, tithes, donations, mass intentions
- **Campaign Management**: Create and track donation campaigns with target amounts and deadlines
- **Custom Donation Types**: Parish-defined donation categories
- **Payment on Behalf**: Record payments made by others with proper attribution
- **Monthly Tracking**: Track monthly offerings and contributions
- **Receipt Generation**: Automated receipt numbering for all payments

### Mass Intention Management
- Book mass intentions (Thanksgiving, Requiem, Special Intentions)
- Stipend tracking and payment recording
- Link intentions to specific masses/events

### Appointment Booking
- Schedule appointments for confession, counseling, meetings
- Assign appointments to specific staff members
- Status tracking (Pending, Confirmed, Cancelled, Completed)

### Live Streaming
- Manage live stream events
- Schedule and broadcast masses and events
- Real-time status tracking

### Event Management
- Create and manage parish events
- RSVP tracking with attendance limits
- Event status management

### Role-Based Access Control
- **Super Admin**: Platform-wide administration
- **Parish Admin**: Full parish access (Parish Priest)
- **Parish Secretary**: Administrative support
- **Parish Staff**: Limited operational access
- **Outstation Admin**: Outstation-level management
- **Organization President/Secretary**: Pious organization management
- **Parishioner**: Self-service portal

## Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Security**: bcrypt for password hashing, TLS/SSL encryption

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- npm or yarn package manager

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ecclesia-dpm.git
cd ecclesia-dpm
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ecclesia_dpm"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NODE_ENV="development"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Seed database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` to access the application.

## Project Structure

```
ecclesia-dpm/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utilities and Prisma client
├── prisma/                # Database schema and migrations
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript definitions
```

## API Documentation

### Feature Settings
- `GET /api/organizations/[id]/features` - Get feature settings
- `PUT /api/organizations/[id]/features` - Update feature settings

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Payments
- `GET /api/payments` - List all payments
- `POST /api/payments` - Record new payment
- `GET /api/payments/[id]` - Get payment details
- `PUT /api/payments/[id]` - Update payment

### Donation Campaigns
- `GET /api/donation-campaigns` - List campaigns
- `POST /api/donation-campaigns` - Create campaign
- `GET /api/donation-campaigns/[id]` - Get campaign details
- `PUT /api/donation-campaigns/[id]` - Update campaign

### Mass Intentions
- `GET /api/mass-intentions` - List mass intentions
- `POST /api/mass-intentions` - Book mass intention
- `PUT /api/mass-intentions/[id]` - Update mass intention

### Parishioners
- `GET /api/parishioners` - List parishioners
- `POST /api/parishioners` - Create parishioner
- `GET /api/parishioners/[id]` - Get parishioner details
- `PUT /api/parishioners/[id]` - Update parishioner

## Security Features

### Authentication & Authorization
- JWT-based session management
- Role-based access control (RBAC)
- Hierarchical data access based on organization
- Password hashing with bcrypt

### Data Protection
- SQL injection prevention via Prisma parameterized queries
- Input validation and sanitization
- CSRF protection
- Rate limiting on API endpoints

### Audit Logging
- Comprehensive audit trail for sensitive operations
- IP address tracking
- Action and entity tracking

### Infrastructure Security
- TLS/SSL encryption in transit
- Database encryption at rest
- VPC deployment
- Regular security audits

## Payment System

### Recording Payments

All payments are recorded through the unified `Payment` model:

```typescript
// Example: Record an offering
POST /api/payments
{
  "amount": 5000,
  "purpose": "OFFERING",
  "month": 1, // January
  "paymentMethod": "CASH",
  "payerName": "John Doe",
  "organizationId": "parish-uuid"
}

// Example: Record payment on behalf
POST /api/payments
{
  "amount": 10000,
  "purpose": "TITHE",
  "paymentMethod": "BANK_TRANSFER",
  "payerName": "Jane Smith",
  "onBehalfOf": "Mary Johnson",
  "organizationId": "parish-uuid"
}

// Example: Record mass intention payment
POST /api/payments
{
  "amount": 2000,
  "purpose": "MASS_INTENTION",
  "massIntentionId": "intention-uuid",
  "paymentMethod": "CASH",
  "payerName": "Peter Brown",
  "organizationId": "parish-uuid"
}
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Deployment Platforms
- Vercel (Recommended for Next.js)
- AWS (EC2, RDS, CloudFront)
- Google Cloud Platform
- Azure

### Environment Variables (Production)

Ensure all environment variables are properly set:
- `DATABASE_URL` - Production database connection
- `NEXTAUTH_SECRET` - Strong random secret
- `NEXTAUTH_URL` - Production URL
- `NODE_ENV=production`

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software owned by Ecclesia Corp.

## Support

For technical support, please contact:
- Email: support@ecclesiadpm.com
- Documentation: https://docs.ecclesiadpm.com

## Roadmap

- [ ] Mobile applications (iOS/Android)
- [ ] SMS notifications
- [ ] Email integration
- [ ] Advanced reporting and analytics
- [ ] Multi-language support
- [ ] Offline mode capability

## Acknowledgments

Built with care for the Catholic Church community to streamline parish administration and enhance spiritual engagement.