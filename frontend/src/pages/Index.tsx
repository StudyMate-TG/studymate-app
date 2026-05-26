import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Dashboard from "@/components/Dashboard";
import CalendarPreview from "@/components/CalendarPreview";
import Gamification from "@/components/Gamification";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Dashboard />
      <CalendarPreview />
      <Gamification />
      <Footer />
    </div>
  );
};

export default Index;
