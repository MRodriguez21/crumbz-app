import { APP_NAME } from '@crumbz/shared';

// Placeholder until the public pages (phase 8) land.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3 px-4 py-12">
      <h1 className="text-[32px] leading-9 font-extrabold tracking-[-0.03em]">{APP_NAME}</h1>
      <p className="text-text-muted">Dónde comer en Caracas, dicho por gente que fue.</p>
    </main>
  );
}
