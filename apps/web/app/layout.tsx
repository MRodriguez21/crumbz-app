import { APP_NAME, APP_URL } from '@crumbz/shared';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? APP_URL),
  title: {
    default: `${APP_NAME} · Descubre dónde comer en Venezuela`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Reseñas, rankings y datos prácticos de restaurantes y emprendimientos de comida en Venezuela.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-VE" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
