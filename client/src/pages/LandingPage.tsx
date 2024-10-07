import Header from "../components/Header";

const LandingPage: React.FC = () => {
  return (
    <>
    <Header />
    <div className="flex justify-center items-center flex-col h-full w-full gap-20">
    <h2 className="text-4xl">Revolutionising Transport in Ireland</h2>
    <h3 className="text-xl">BikeHood is transforming communities by creating Ireland's first cycling neighbourhood - paving the way for sustainable, healthy, and eco-friendly transport.</h3>
    <button className="bg-[#635BFF] text-white font-sans px-4 py-4 rounded-lg">Use the twin</button>
    </div>
    </>
  )
}

export default LandingPage;