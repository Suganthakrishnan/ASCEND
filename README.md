<div align="center">

# ⚔️ ASCEND
### *Level Up Your Real Life*

**A free, open-source RPG fitness & productivity app inspired by Solo Levelling**

</div>

---

## 🎮 What is Ascend?

Ascend transforms health and fitness tracking into an RPG game. Every workout, sleep log, and daily task you complete earns XP, levels up your character, and grows your real-life stats — **Strength, Intelligence, Stamina, Code Knowledge, Agility, and Communication.**

Most gamified fitness apps hide their best features behind paywalls and subscriptions. Ascend is completely free. No battle passes. No premium tiers. Just you vs. your goals.

> *Inspired by the grind philosophy of Solo Levelling — where consistent effort is the only cheat code.*

---

## ✨ Features

### ⚔️ RPG Progression System
- **6 Character Stats** — Strength, Intelligence, Stamina, Code Knowledge, Agility, Communication
- **XP & Leveling** — Earn XP for every completed task, workout, and habit
- **Rank System** — Climb from Novice → E-Rank → D-Rank → C-Rank → B-Rank → A-Rank → S-Rank
- **Daily Quest Board** — Active quests with XP rewards and difficulty tiers
- **Achievements & Badges** — Unlock milestones as you progress

### 🏋️ Workout Tracking
- **Advanced Workout Planner** — Build custom routines from a comprehensive exercise library
- **Workout Session Tracking** — Live set/rep/weight logging with rest timers
- **Exercise Database** — Full gym exercise library across Chest, Back, Arms, Legs, Shoulders, Core, Cardio
- **Workout History** — Personal records tracking and weekly progress charts

### 😴 Sleep & Wellness
- **Sleep Tracker** — Log bedtime, wake time, and quality rating (1–5 stars)
- **Sleep Analytics** — Trends, averages, and goal tracking
- **Screen Time Tracker** — Monitor digital wellness with daily limits and focus timers

### 📊 Analytics & Progress
- **Progress Rings** — Real-time circular indicators for calories, workout minutes, and water intake
- **Analytics Dashboard** — Pill-tab charts with weekly/monthly views
- **Daily Progress Tracking** — Calories, protein, water, workout minutes all in one place

### 🗓️ Tasks & Scheduling
- **Daily Task System** — Create tasks with difficulty (Easy/Medium/Hard), category, and XP rewards
- **Deadline Tasks** — Time-sensitive quests with urgency tracking
- **Calendar & Schedule** — Plan your training week

### 🎨 UI/UX
- **Cyberpunk Dark Theme** — Deep black backgrounds with cyan glow accents
- **Glass Morphism** — Translucent cards with blur effects and layered depth
- **Smooth Animations** — Fade-ins, progress ring animations, typewriter effects, scanning lines
- **Custom Component Library** — HudContainer, ProgressRing, StatBar, GlowInput, Button

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK v54 |
| Language | TypeScript |
| Navigation | React Navigation v7 |
| Backend | Supabase (Auth + PostgreSQL) |
| Monitoring | Sentry + Firebase Analytics |
| Animations | React Native Reanimated |
| Icons | Lucide React Native |
| Code Quality | ESLint + Prettier |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- Android/iOS device or emulator

### Installation

```bash
# Clone the repository
git clone https://github.com/Suganthakrishnan/THE-SYSTEM.git
cd THE-SYSTEM

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Setup

Fill in your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_google_client_id
```

### Database Setup

Run the migrations in your Supabase SQL editor in order:

```bash
supabase_migrations/001_initial_schema.sql
supabase_migrations/002_schema_expansion.sql
```

### Running the App

```bash
# Development (instant reload via Expo Go)
npx expo start

# Build preview APK (for device testing)
eas build --platform android --profile preview

# Build production APK
eas build --platform android --profile production
```

> **Tip:** Use `npx expo start` with the Expo Go app for rapid UI development. Only build with EAS when testing native features or preparing for release.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── ScreenWrapper.tsx        # Safe area layout wrapper
│   └── ui/
│       ├── Button.tsx               # Multi-variant button with animations
│       ├── HudContainer.tsx         # Glass morphism card container
│       ├── GlowInput.tsx            # Input with focus glow effect
│       ├── ProgressRing.tsx         # Circular progress indicator
│       ├── StatBar.tsx              # Horizontal stat bar with shimmer
│       └── AnimatedCounter.tsx      # Animated number counter
├── constants/
│   └── theme.ts                     # Design token system
├── context/
│   ├── AuthContext.tsx              # Auth state provider
│   └── PersistenceContext.tsx       # Offline persistence provider
├── navigation/
│   ├── AppNavigator.tsx             # Root navigator
│   ├── AuthNavigator.tsx            # Login/Register flow
│   ├── OnboardingNavigator.tsx      # Onboarding flow
│   └── TabNavigator.tsx             # Main 4-tab navigator
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── OnboardingScreen.tsx
│   ├── main/
│   │   ├── HomeDashboard.tsx        # Main RPG dashboard
│   │   ├── DailyTasks.tsx           # Quest board
│   │   ├── Profile.tsx              # Character profile
│   │   ├── WorkoutPlanner.tsx
│   │   ├── AdvancedWorkoutPlanner.tsx
│   │   └── WorkoutSession.tsx
│   ├── AnalyticsScreen.tsx
│   ├── AchievementsScreen.tsx
│   ├── SleepTrackerScreen.tsx
│   ├── ScreenTimeTrackerScreen.tsx
│   ├── ScheduleScreen.tsx
│   └── NotificationsScreen.tsx
├── services/
│   ├── authService.ts
│   ├── statsService.ts              # XP, levels, character stats
│   ├── taskService.ts               # Quest management
│   ├── workoutPlannerService.ts
│   ├── sleepService.ts
│   ├── analyticsService.ts
│   ├── achievementsService.ts
│   ├── profileService.ts
│   └── persistence/                 # Offline storage layer
└── utils/
    └── responsive.ts                # Screen-size scaling utilities
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Authentication (email/password + demo mode)
- [x] RPG stat system with XP & leveling
- [x] Home dashboard with progress rings
- [x] Daily quest board with task management
- [x] Workout planner (basic + advanced)
- [x] Sleep tracker with quality rating
- [x] Screen time tracker
- [x] Analytics dashboard
- [x] Achievement & rank system
- [x] Calendar & scheduling
- [x] Cyberpunk UI with glass morphism
- [x] Sentry + Firebase crash reporting
- [x] Production database setup

### 🚧 In Progress
- [ ] Google OAuth sign-in
- [ ] Complete onboarding flow refinement
- [ ] UI responsiveness polish (tablet/landscape)
- [ ] Play Store deployment

### 🔮 Planned
- [ ] Push notifications
- [ ] Health API integrations (Google Fit, Apple Health)
- [ ] Real-time sync
- [ ] Social features & leaderboards
- [ ] Offline mode improvements
- [ ] CI/CD pipeline
- [ ] Full test suite

---

This is a personal project in active development. Contributions are not open at this time, but feedback and bug reports via Issues are welcome.

---

## 👤 Author

**Sugantha Krishnan T**
Electronics & Communication Engineering, VIT Chennai


---

<div align="center">

**Built for the grind. Free forever.**

*⚔️ Every rep counts. Every log earns XP. Level up in real life.*

</div>
