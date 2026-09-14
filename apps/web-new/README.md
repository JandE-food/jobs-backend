## BEJELI Web New

Separate Next.js web app for the reference-based BEJELI experience.

### Local development

```bash
npm install
npm run dev
```

The app runs on [http://localhost:3002](http://localhost:3002).

### Backend connection

- Uses the same API server configuration as the existing web app and mobile app.
- Reuses the same authentication flow and role-aware routes.
- Keeps talent and recruiter experiences in a separate app folder from `apps/web`.
