const Hero = () => {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-green-100">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to BikeHood
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-700 md:text-xl">
                Creating Ireland's First Cycling Neighbourhood for Sustainable Transport and Mobility.
                </p>
              </div>
              <div className="space-x-4">
                <button className="bg-black text-white
                font-nunito px-4 py-2 rounded-md shadow-sm">Learn More</button>
                <button className="bg-white border border-black/0
                font-nunito px-4 py-2 rounded-md shadow-sm">Sign Up for Updates</button>
              </div>
            </div>
          </div>
        </section>
    )
}

export default Hero