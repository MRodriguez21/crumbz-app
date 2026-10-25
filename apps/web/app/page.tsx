import { APP_NAME } from '@crumbz/shared';

// Placeholder until the design system (phase 0.5) and public pages (phase 8) land.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p>Muy pronto: descubre dónde comer en Caracas.</p>
    </main>
  );
}
