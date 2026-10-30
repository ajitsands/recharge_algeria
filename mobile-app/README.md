# Razik Telecom - Mobile Dealer Application (Android & iOS)

This is the React Native mobile application for Razik Telecom dealers and shopkeepers in Algeria.

## Features
- **Algerian Heritage Styling:** Styled with Algerian emerald green, ruby red, and warm Saharan gold accents.
- **Cash Collection Agent App:** Collection agents can sign in with accounts created by vendor admins or dealers, search assigned dealers, review wallet and outstanding-debt balances, and record full or partial cash payments.
- **Customer-Verified Collections:** Each collection creates a six-digit code that expires after 10 minutes. The shopkeeper shares the code with the agent to confirm the payment and reduce the dealer's outstanding debt.
- **Collection History:** Agents can view their recent confirmed collections and transaction references.
- **Prefix-Based Auto Detection:** Automatically switches between **Mobilis** (`06`), **Djezzy** (`07`), and **Ooredoo** (`05`) as the phone number is entered.
- **Instant Commission Deduction:** Automatically deducts `Face Value - Commission %` from the dealer's digital wallet upon recharge confirmation.
- **Multi-Service Grid:** Mobile Flexy, Sonelgaz Electricity Bills, ADE Water Bills, Inter-Wilaya Bus Tickets, 4G / ADSL Internet Top-ups.
- **Wallet Top-up Request:** Request balance from Razik Telecom Admin via Cash Collection, BaridiMob, or CCP.
- **Dispute & Complaint Booking:** Submit a ticket on any delayed or failed recharge with direct transaction reference.

## Running Locally

1. Install dependencies:
   ```bash
   cd mobile-app
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npm start
   ```

For a physical device or production build, set `EXPO_PUBLIC_API_URL` to the backend API base URL (for example, `https://your-domain.example/api`). The default `10.0.2.2` address is for the Android emulator.

3. Run on Android:
   ```bash
   npm run android
   ```

4. Build production Android APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```

Collection agents can select **Collection Agent Sign In** from the mobile app. Only a vendor administrator can create agent accounts in the Admin Portal under **Collection Agents**. Shopkeepers and dealers cannot create agent accounts.

The Admin Portal's mobile QR dialog also offers a **Collection Agent** QR option. Scan it with the phone camera to open the browser-based collection app directly; it uses the same backend and workflow without needing Expo Go. For local testing, the phone and computer must be on the same Wi-Fi network.
