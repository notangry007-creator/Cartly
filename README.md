# Cartly — Nepal E-Commerce Platform

A full-stack Expo monorepo for a Nepal-focused e-commerce platform. Consists of two apps sharing a compatible data model: a buyer app and a seller dashboard.

## Apps

| App | Directory | Audience | Theme |
|---|---|---|---|
| **Buy** | `buy/` | Buyers / shoppers | Red `#E53935` |
| **Sell** | `sell/` | Sellers / shop owners | Green `#1E8449` |

## Shared Data Model

Both apps use the same canonical types for cross-app compatibility:

| Type | Description |
|---|---|
| `OrderStatus` | `pending → confirmed → packed → shipped → out_for_delivery → delivered` / `cancelled` / `return_requested → return_approved → return_picked → refunded` |
| `Product` | `id`, `title`, `categoryId`, `variants[]`, `basePrice`, `baseMrp` |
| `ProductVariant` | `id`, `label`, `price`, `mrp`, `stock`, `sku` |
| `PaymentMethod` | `cod`, `wallet`, `esewa`, `khalti`, `bank_transfer` |
| `Order` | `id`, `items[]`, `status`, `paymentMethod`, `buyerName/Phone/Address` |

## Quick Start

```bash
# Run the buyer app
cd buy && npm install && npm start

# Run the seller app
cd sell && npm install && npm start
```

## Running Tests

```bash
# Buy app — 127 tests
cd buy && npm test

# Sell app — 33 tests
cd sell && npm test
```

## Tech Stack

Both apps use:
- **Expo SDK 54** + **Expo Router v6** (file-based navigation)
- **TypeScript** (strict mode)
- **Zustand** (state management with AsyncStorage persistence)
- **Jest + jest-expo** (testing)

### Buy app additionally uses:
- React Native Paper (Material Design 3 UI)
- TanStack React Query (data fetching)
- React Hook Form + Zod (form validation)
- expo-secure-store (auth token storage)
- expo-notifications (push notifications)
- expo-location + react-native-maps (delivery tracking)

## Project Structure

```
Cartly/
├── buy/          # Buyer app
│   ├── app/      # Expo Router screens
│   ├── src/      # Stores, hooks, components, types, utils
│   └── assets/   # Icons and images
├── sell/         # Seller dashboard app
│   ├── app/      # Expo Router screens
│   ├── src/      # Stores, components, types, utils
│   └── assets/   # Icons and images
└── README.md
```

## Connecting to a Backend

Both apps store data locally via AsyncStorage. To connect to a shared API:

1. Replace store `AsyncStorage` calls with API requests
2. Align the shared types in a `packages/shared` directory
3. Add auth tokens via `expo-secure-store`
4. Use the same `OrderStatus` and `Product` types on the backend
