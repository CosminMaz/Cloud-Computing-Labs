import { useState } from "react";
import GovHeader from "./components/GovHeader/GovHeader";
import HeroSection from "./components/HeroSection/HeroSection";
import InfoSection from "./components/InfoSection/InfoSection";
import ApplicationForm from "./components/ApplicationForm/ApplicationForm";
import Dashboard from "./components/Dashboard/Dashboard";
import ArchitecturePage from "./components/ArchitecturePage/ArchitecturePage";
import CloudArchBadge from "./components/CloudArchBadge/CloudArchBadge";
import Footer from "./components/Footer/Footer";

function App() {
  const [view, setView] = useState("home");

  return (
    <div className="app">
      <GovHeader currentView={view} setView={setView} />

      {view === "home" && (
        <>
          <HeroSection setView={setView} />
          <InfoSection />
        </>
      )}

      {view === "form" && <ApplicationForm setView={setView} />}

      {view === "dashboard" && <Dashboard />}

      {view === "architecture" && <ArchitecturePage />}

      <CloudArchBadge setView={setView} />
      <Footer />
    </div>
  );
}

export default App;
