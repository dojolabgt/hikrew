import { Sora, DM_Sans } from "next/font/google";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import "slick-carousel/slick/slick.css";
import "./assets/main.css";

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--body-color-font',
});

const dm_sans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--body-color-font',
});

export const metadata = {
  title: {
    absolute: '',
    default: 'Hi Krew',
    template: '%s | Hi Krew',
  },
  description: 'Hi Krew',
  openGraph: {
    title: 'Hi Krew',
    description: 'Hi Krew',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="author" content="Themeservices" />
        <link rel="icon" href="/HiKrewLogo.png" sizes="any" />
      </head>
      <body className={`${sora.variable} ${dm_sans.variable}`}>
        {children}
      </body>
    </html>
  );
}
