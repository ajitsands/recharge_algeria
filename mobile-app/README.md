# Razik Telecom - Mobile Dealer Application (Android & iOS)

This is the React Native mobile application for Razik Telecom dealers and shopkeepers in Algeria.

## Features
- **Algerian Heritage Styling:** Styled with Algerian emerald green, ruby red, and warm Saharan gold accents.
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

3. Run on Android:
   ```bash
   npm run android
   ```

4. Build production Android APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
