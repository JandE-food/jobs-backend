# BEJELI Mobile

React Native mobile app for the BEJELI prototype, rebuilt from the existing `apps/web` Kindred experience while keeping the same visual design direction.

## Run

1. Open a terminal in `apps/mobile`
2. Install dependencies:

```bash
npm install
```

3. Start Expo:

```bash
npm start
```

4. Open on a device or simulator with Expo Go / Android Studio / Xcode

## Auth API

- The mobile app now uses the backend auth endpoints instead of local-only demo sign-in
- Set `EXPO_PUBLIC_API_URL` to your API base URL before running Expo
- Example:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001
```

## Notes

- Main entry: `App.tsx`
- Shared auth state: `src/auth.tsx`
- Mock data and bundled images: `src/data/mock.ts`
- Theme tokens: `src/theme.ts`
- Reference image assets: `assets/reference/`
