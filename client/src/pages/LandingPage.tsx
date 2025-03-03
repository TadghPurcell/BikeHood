import Header from "../components/Header";
import Hero from "../components/Hero";
import Info from "../components/Info";
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
        <Analytics />
        <Contact />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
