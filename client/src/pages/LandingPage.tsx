import Header from "../components/Header";
import Hero from "../components/Hero";
import Info from "../components/Info";
import Twin from "../components/Twin";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import Analytics from "../components/Analytics";

const LandingPage: React.FC = () => {
  return (
    <>
      <Header />
      <main className="font-nunito">
        <Hero />
        <Info />
        <Twin />
        <Analytics />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
