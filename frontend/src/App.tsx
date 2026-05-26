import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Index from "./pages/Index";
import Home from "./pages/Home";
import Subjects from "./pages/Subjects";
import CalendarPage from "./pages/CalendarPage";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import MobileNav from "./components/MobileNav";
import NotFound from "./pages/NotFound";
import NewSubject from "./pages/NewSubject";
import NewTask from "./pages/NewTask";
import EditProfile from "./pages/EditProfile";
import NewAttendance from "./pages/NewAttendance";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  const routesWithoutNav = ["/login", "/desktop"];

  const shouldShowMobileNav = !routesWithoutNav.includes(location.pathname);

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-[430px] h-[calc(100vh-16px)] md:h-[calc(100vh-32px)] max-h-[932px] bg-background shadow-2xl md:rounded-3xl overflow-hidden relative">
        <Routes>
          <Route path="/desktop" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/subjects/new" element={<NewSubject />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/tasks/new" element={<NewTask />} />
          <Route path="/attendance/new" element={<NewAttendance />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        {shouldShowMobileNav && <MobileNav />}
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;