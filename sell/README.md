# Sell — Cartly Seller App

A production-grade Expo seller dashboard for the Cartly Nepal e-commerce platform. Sellers can manage product listings, process orders, track analytics, and request payouts.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 + Expo Router v6 |
| Language | TypeScript (strict mode) |
| State | Zustand + AsyncStorage persistence |
| Navigation | Expo Router (file-based, typed routes) |
| Images | expo-image + expo-image-picker |
| Testing | Jest + jest-expo |
| Styling | React Native StyleSheet + custom design tokens |

## Features

### Dashboard
- Revenue, order, product, and pending order stats
- Alerts for pending orders and low-stock products
- Time-aware greeting (morning / afternoon / evening)
- Quick action shortcuts
- Recent orders list

### Products
- Full product list with search and status filter tabs
- Add product with image upload (camera or gallery, up to 5 images)
- Edit product (name, description, pricing, stock, category, tags, status)
- Stock update with automatic status toggle (0 stock → out_of_stock)
- Delete product with confirmation
- Skeleton loading states

### Orders
- Order list with search and 7-status filter tabs
- Order detail with buyer info, item breakdown, payment summary
- Status advancement workflow: Pending → Confirmed → Processing → Shipped → Delivered
- Cancel order (pending/confirmed only)
- Skeleton loading states

### Analytics
- Live revenue and order counts from store data
- Revenue bar chart with real period-filtered data (7 / 14 / 30 days)
- Top products ranked by total sold
- Order breakdown by status (live counts)

### Payouts
- Available balance computed from delivered order revenue
- Request payout with amount, method (Bank Transfer / eSewa / Khalti), and account details
- Full payout history with status badges
- Payout store persisted to AsyncStorage

### Profile
- Seller shop card with rating and verified badge
- Edit profile (name, shop name, description, phone, email)
- Notifications center with unread badge and mark-all-read
- Help & Support screen with FAQ
- Terms & Privacy screen
- Logout with confirmation

## Project Structure

```
sell/
├── app/                        # Expo Router screens
│   ├── (auth)/login.tsx        # Phone login
│   ├── (tabs)/                 # Tab bar screens
│   │   ├── dashboard.tsx
│   │   ├── products.tsx
│   │   ├── orders.tsx
│   │   ├── analytics.tsx
│   │   └── profile.tsx
│   ├── product/[id].tsx        # Product detail
│   ├── product/new.tsx         # Add product
│   ├── product/edit/[id].tsx   # Edit product
│   ├── order/[id].tsx          # Order detail
│   ├── notifications.tsx
│   ├── payouts.tsx
│   ├── edit-profile.tsx
│   ├── support.tsx
│   └── privacy.tsx
├── src/
│   ├── components/
│   │   ├── common/             # EmptyState, StatCard, Badges, SkeletonLoader, ScreenHeader
│   │   └── product/            # ProductForm (shared new/edit)
│   ├── stores/                 # authStore, productStore, orderStore, notificationStore, payoutStore
│   ├── types/index.ts          # All TypeScript interfaces and union types
│   ├── theme.ts                # Colors, Spacing, FontSize, BorderRadius, Shadow
│   ├── data/seed.ts            # Demo data for Nepal e-commerce seller
│   └── utils/                  # helpers.ts, storage.ts
└── assets/                     # App icon, splash, adaptive icons
```

## Getting Started

```bash
cd sell
npm install
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS (macOS only)
npm run web        # Web browser
```

## Running Tests

```bash
npm test
npm run test:coverage
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure and build
eas build --platform android
eas build --platform ios
```

## Demo

Login with any 10-digit phone number to access the demo seller account (Ram Electronics & Gadgets).

## Connecting to a Real Backend

All data operations go through the Zustand stores in `src/stores/`. To connect to a real API:

1. Replace `AsyncStorage` calls with API requests in each store
2. Add an auth token (use `expo-secure-store`) to `authStore`
3. Replace `SEED_*` data imports in the stores with API fetch calls
4. Add React Query for caching and background refresh
