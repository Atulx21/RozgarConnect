# RozgarConnect

A comprehensive mobile platform connecting job seekers with employers and equipment providers in rural and agricultural communities. Built with React Native and Expo, featuring real-time messaging, equipment rental, job posting, and user ratings.

## 🚀 Features

### Core Functionality
- **Job Marketplace**: Post and apply for jobs in farming, construction, cleaning, delivery, and cooking
- **Equipment Rental**: Rent agricultural and construction equipment like tractors, threshers, and harvesters
- **User Profiles**: Comprehensive profiles with skills, ratings, and work history
- **Real-time Messaging**: In-app messaging between job applicants and employers
- **Location Services**: Geospatial job and equipment listings
- **Notifications**: Real-time push notifications for job updates and messages

### User Management
- **Role-based Access**: Unified user system with flexible role selection
- **Authentication**: Secure login with Supabase Auth
- **Profile Management**: Edit profiles, upload images, manage skills
- **Ratings & Reviews**: Rate completed jobs and service providers

### Advanced Features
- **Search & Discovery**: Advanced search for jobs and equipment
- **Application Tracking**: Track job applications and their status
- **Equipment Booking**: Book equipment with availability management
- **Statistics Dashboard**: View personal and platform statistics
- **Report System**: Report inappropriate content or disputes

## 🛠 Tech Stack

### Frontend
- **React Native 0.79.1** - Cross-platform mobile development
- **Expo SDK 53** - Development platform and build tools
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Expo Router** - File-based routing for React Native
- **React Native Paper** - Material Design components
- **React Native Reanimated** - Smooth animations

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Database-level access control
- **Real-time Subscriptions** - Live data updates

### Development Tools
- **Expo CLI** - Development and build commands
- **TypeScript** - Static type checking
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Key Libraries
- **@supabase/supabase-js** - Supabase client
- **@react-navigation/native** - Navigation
- **expo-camera** - Camera functionality
- **expo-image-picker** - Image selection
- **expo-linear-gradient** - Gradient backgrounds
- **expo-haptics** - Haptic feedback

## 📱 Screenshots

*(Add screenshots of your app here)*

## 🏗 Project Structure

```
RozgarConnect/
├── app/                          # Main application code
│   ├── (tabs)/                   # Tab-based navigation screens
│   │   ├── index.tsx            # Home dashboard
│   │   ├── jobs.tsx             # Job listings
│   │   ├── equipment.tsx        # Equipment marketplace
│   │   ├── search.tsx           # Search functionality
│   │   ├── applications.tsx     # Job applications
│   │   ├── notifications.tsx    # Notifications
│   │   └── profile.tsx          # User profile
│   ├── auth/                    # Authentication screens
│   │   ├── login.tsx           # Login screen
│   │   └── profile-setup.tsx   # Profile setup
│   ├── jobs/                   # Job-related screens
│   │   ├── post.tsx            # Post new job
│   │   ├── my-jobs.tsx         # User's jobs
│   │   └── [id]/               # Job detail screens
│   ├── equipment/              # Equipment screens
│   │   ├── add.tsx             # Add equipment
│   │   ├── my-equipment.tsx    # User's equipment
│   │   └── [id]/               # Equipment detail
│   ├── profile/                # Profile management
│   ├── search/                 # Search screens
│   ├── skills/                 # Skills management
│   ├── stats/                  # Statistics dashboard
│   └── notifications/          # Notification screens
├── components/                 # Reusable UI components
│   ├── JobCard.tsx            # Job listing card
│   ├── EquipmentCard.tsx      # Equipment card
│   ├── UserCard.tsx           # User profile card
│   ├── LoadingSpinner.tsx     # Loading indicator
│   ├── ErrorMessage.tsx       # Error display
│   └── StatCard.tsx           # Statistics card
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   ├── useJobs.ts            # Jobs management
│   ├── useEquipment.ts       # Equipment management
│   └── useFrameworkReady.ts  # Framework initialization
├── lib/                       # Library configurations
│   └── supabase.ts           # Supabase client setup
├── utils/                     # Utility functions
│   ├── constants.ts          # App constants
│   ├── validation.ts         # Form validation
│   ├── dateHelpers.ts        # Date utilities
│   └── theme.ts              # Theme configuration
├── types/                     # TypeScript type definitions
├── assets/                    # Static assets
│   └── images/               # Image files
├── supabase/                  # Database migrations
│   └── migrations/           # SQL migration files
└── scripts/                   # Utility scripts
    └── setup-database.js     # Database setup script
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **Supabase account** for backend services

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RozgarConnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Run the database migrations:
   ```bash
   node scripts/setup-database.js
   ```

### Running the App

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Run on device/emulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

### Build Commands

```bash
# Lint code
npm run lint

# Build for web
npm run build:web
```

## 📊 Database Schema

### Core Tables

- **profiles** - User profiles with skills and ratings
- **jobs** - Job postings with location and requirements
- **applications** - Job applications and status tracking
- **equipment** - Equipment listings for rental
- **bookings** - Equipment booking records
- **messages** - In-app messaging system
- **notifications** - Push notifications
- **reports** - Dispute reporting system

### Key Relationships

- Users can post jobs and equipment
- Workers can apply to jobs and book equipment
- Messaging is tied to job applications
- Ratings are given after job completion

## 🔐 Security & Privacy

- **Row Level Security (RLS)** enabled on all tables
- **JWT Authentication** via Supabase Auth
- **Secure file uploads** with Supabase Storage
- **Data validation** on both client and server
- **Privacy-focused** user data handling

## 📦 Deployment

### Mobile App Stores

1. **Build for production**
   ```bash
   expo build:ios
   expo build:android
   ```

2. **Submit to app stores**
   - Follow Expo's submission guides for App Store and Google Play

### Web Deployment

1. **Export web build**
   ```bash
   npm run build:web
   ```

2. **Deploy to hosting service**
   - Netlify, Vercel, or any static hosting provider

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Use Prettier for code formatting
- Run ESLint before committing
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Powered by [Supabase](https://supabase.com/)
- UI components from [React Native Paper](https://reactnativepaper.com/)

---

**RozgarConnect** - Connecting Communities, Creating Opportunities 🚀</content>
<parameter name="filePath">d:\E Drive\RozgarConnect\RozgarConnect\README.md