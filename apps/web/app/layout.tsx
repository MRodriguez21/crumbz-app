import { APP_NAME, APP_URL } from '@crumbz/shared';
import { tokensToCss } from '@crumbz/ui';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '800'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? APP_URL),
  title: {
    default: `${APP_NAME} · Descubre dónde comer en Venezuela`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Reseñas, rankings y datos prácticos de restaurantes y emprendimientos de comida en Venezuela.',
};

// Design tokens shared with the app (packages/ui), emitted as CSS custom properties.
const tokenCss = tokensToCss();

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-VE" className={`${manrope.variable} h-full antialiased`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokenCss }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
