import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { DashboardPreview } from './components/DashboardPreview';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Technologies } from './components/Technologies';

export function NexStarterTemplate() {
    return (
        <div className="flex flex-col min-h-screen font-sans">
            <Header />
            <main className="flex-1">
                <Hero />
                <Technologies />
                <Features />
                <DashboardPreview />
            </main>
            <Footer />
        </div>
    );
}
