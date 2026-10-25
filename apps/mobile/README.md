# crumbz — mobile

Expo (SDK 58) + Expo Router. Routes live in `src/app/`.

```bash
pnpm --filter mobile start      # dev server; open with Expo Go on Android/iOS
pnpm --filter mobile typecheck
pnpm --filter mobile lint
pnpm --filter mobile doctor     # expo-doctor
```

- Env vars: `apps/mobile/.env.local` (see root `.env.example`).
- Add native packages with `npx expo install <pkg>` (run from `apps/mobile`) so versions match the SDK.
- See the root `CLAUDE.md` for project rules.
