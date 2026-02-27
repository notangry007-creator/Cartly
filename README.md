# Buy — Nepal E-Commerce Buyer App

A production-grade, fully functional **frontend-only** buyer mobile app for an e-commerce & delivery platform in Nepal.

Built with **Expo + React Native + TypeScript**, structured as if backed by a real API — ready to swap the local data layer for real endpoints.

---

## Features

- **Authentication** — Phone login with OTP (simulated), SecureStore session, profile completion
- **App Tour** — Animated 4-slide onboarding walkthrough on first install
- **Zone Selection** — GPS-based or manual zone picking (Kathmandu Core/Outer, Major City, Rest of Nepal)
- **Home** — Hero banners, categories, fast delivery section, verified sellers, top deals, pull-to-refresh
- **Search** — Debounced search, recent history, filters (COD/fast delivery/verified/rating/price), sort
- **Categories** — Grid with subcategory chips
- **Product Detail** — Image gallery, variant picker, delivery ETA by zone, seller card with call/WhatsApp, reviews, add to cart/buy now
- **Cart** — Swipe-to-delete, coupon validation, price breakdown with COD fee preview
- **Checkout** — 4-step flow (Address → Delivery → Payment → Review), COD + Wallet
- **Orders** — Timeline with simulated progression, cancel, return request, buy again
- **Wallet** — Balance, transaction history, top-up with custom numpad
- **Returns** — Photo upload (camera/gallery), return reason, request submission
- **Notifications** — Local push notifications for every order status change
- **Wishlist** — Add/remove, move to cart
- **Seller Profile** — Full seller page with all products, ratings, contact
- **Offers** — Coupon browser with one-tap copy and apply to cart
- **Privacy & Security** — Granular data permission toggles, delete account
- **Dark Mode** — Full theme switching via React Native Paper

### Nepal-specific
- COD availability enforced by zone
- Delivery ETA bands per zone (same-day/next-day/standard)
- Landmark + ward + map pin addressing (weak address system)
- Pickup point fallback toggle for remote areas
- Authenticity verification badges
- Timur, Pashmina, Lokta Paper, Mustang Honey and other local products in seed data

---

## Tech Stack

| Concern | Library |
|---------|---------|
| Framework | Expo SDK 54 + React Native |
| Language | TypeScript (strict) |
| Routing | Expo Router (file-based) |
| State | Zustand (global) + React Query (async/cache) |
| Forms | React Hook Form + Zod |
| UI | React Native Paper (MD3) |
| Icons | @expo/vector-icons (Ionicons) |
| Auth storage | expo-secure-store |
| App data | @react-native-async-storage/async-storage |
| Maps | react-native-maps + expo-location |
| Notifications | expo-notifications + expo-device |
| Images | expo-image + expo-image-picker |
| Animations | react-native-reanimated + react-native-gesture-handler |
| Date utils | date-fns |
| IDs | uuid |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android emulator / physical device with Expo Go

### Install & Run

```bash
# Install dependencies
npm install

# Start Metro bundler
npx expo start

# Run on Android
npx expo start --android

# Run on iOS (macOS only)
npx expo start --ios
```

### First Run Experience
1. App tour (4 slides) → shown only once
2. Phone login with OTP (displayed in-app for simulation)
3. Zone selection (GPS or manual)
4. Home screen

### Demo OTP
The OTP is always shown on-screen in a yellow banner on the verify screen. Enter it to log in.

---

## Project Structure

```
buy/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, OTP, profile
│   ├── (tabs)/             # Home, Cart, Orders, Categories, Profile
│   ├── product/[id].tsx    # Product detail
│   ├── checkout/           # Multi-step checkout
│   ├── order/              # Order detail, confirmation, return, review
│   ├── addresses/          # Address management with map pin
│   ├── wallet/             # Wallet + top-up
│   ├── tour.tsx            # Onboarding walkthrough
│   ├── onboarding.tsx      # Zone selection
│   └── ...                 # Notifications, wishlist, seller, offers, privacy
├── src/
│   ├── components/
│   │   └── common/         # ProductCard, SkeletonLoader, MapPinPicker, etc.
│   ├── context/            # ToastContext
│   ├── data/
│   │   ├── seed.ts         # All local product/seller/coupon data
│   │   ├── zones.ts        # Zone definitions, ETA/fee maps
│   │   └── images.ts       # Curated image URLs + blurhash
│   ├── hooks/              # useProducts, useOrders, useAddresses, useWallet
│   ├── stores/             # Zustand: auth, cart, zone, notifications, wishlist, tour, theme
│   ├── types/              # All TypeScript types
│   └── utils/              # helpers, otp, storage, pushNotifications
├── eas.json                # EAS Build configuration
└── app.json                # Expo configuration
```

---

## Building for Production

### Using EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for Android (AAB for Play Store)
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

### Before Building
- Update `app.json`: `bundleIdentifier` (iOS) and `package` (Android)
- Update `eas.json`: Apple ID, ASC App ID, Team ID for iOS submissions
- Add `google-service-account.json` for Android Play Store submissions
- Replace `picsum.photos` image URLs with real CDN URLs

---

## Upgrading to a Real Backend

The app is structured to make API migration straightforward:

1. **React Query hooks** in `src/hooks/` — replace `queryFn` bodies with `fetch`/`axios` calls
2. **Zustand stores** — auth store's `login()` should call real OTP API; `logout()` should invalidate token server-side
3. **Local seed data** in `src/data/seed.ts` — replace with API calls in the hooks
4. **OTP simulation** in `src/utils/otp.ts` — replace `generateOTP`/`verifyOTP` with SMS gateway calls
5. **Order progression** timeouts in `src/hooks/useOrders.ts` — replace with webhook/socket listeners

---

## License

MIT
