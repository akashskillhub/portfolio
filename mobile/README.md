# SKILLHUB Admin Mobile Application

A React Native & Expo mobile administration console built with NativeWind styling for the **SKILLHUB Dynamic Portfolio**.

Developed by **Akash Dhone** | **SKILLHUB IT SOLUTION** | [https://www.skillhubdev.com](https://www.skillhubdev.com)

---

## Features

- **Essential Setup Wizard**: First-time initialization wizard matching the web `/setup` wizard (system diagnostics, database ping, specialization track selection, admin account creation, and express starter seeding).
- **Zero Dummy Data**: Strictly powered by environment variables and your real web backend API (`/api/setup/*`, `/api/auth/login`, `/api/admin/*`).
- **NativeWind v4 & Tailwind CSS**: Consistent dark theme matching the web admin dashboard (slate/zinc palette, zero decorative emojis near headings).
- **Dynamic App Name**: Candidates can configure their custom app name in `SettingsScreen` or in `.env` (`EXPO_PUBLIC_APP_NAME`).
- **Full Account Parity**:
  - **Dashboard Overview**: Portfolio health bar, key metrics, and recent inquiries.
  - **Profile & Hero**: Candidate info, rotating typing words, highlight statistics (`10+ Completed Projects`, etc.), and avatar uploads.
  - **About & Education**: Bio narrative, privacy switches (show phone/email/location), and education CRUD.
  - **Skills Matrix**: Categories filter, category CRUD, proficiency sliders, and experience years.
  - **Projects Portfolio**: Projects CRUD, tech stack chips, live demo/repository links, and screenshots.
  - **Experience & Milestones**: Career milestones, current role toggle, and accomplishments.
  - **Contact Inquiries Inbox**: Read/unread toggling, full message modal, and inquiry deletion.
  - **Social Profiles**: Platform links CRUD, order, and public visibility switches.
  - **Media Library**: Cloudinary assets browser, direct image upload forwarded to `/api/admin/media`, and URL copying.
  - **Settings & Dynamic Accent**: Dynamic accent color palette (10 web-matched presets), custom section headings, and branding attributions.

---

## Environment Configuration

Configure `.env` in the `mobile/` directory:

```env
# Backend Next.js API Server Endpoint
EXPO_PUBLIC_API_URL="http://10.0.2.2:3000"

# Dynamic Candidate Application Display Name
EXPO_PUBLIC_APP_NAME="SKILLHUB Admin"

# Branding & Platform Attribution
EXPO_PUBLIC_APP_AUTHOR="Akash Dhone"
EXPO_PUBLIC_ORGANIZATION="SKILLHUB IT SOLUTION"
EXPO_PUBLIC_BRANDING_CREDIT="Built with SKILLHUB"
EXPO_PUBLIC_OFFICIAL_WEBSITE="https://www.skillhubdev.com"
```

*(For Android emulator, use `http://10.0.2.2:3000`. For real devices on Wi-Fi, use your computer's local Wi-Fi IP address, e.g. `http://192.168.1.x:3000`).*
