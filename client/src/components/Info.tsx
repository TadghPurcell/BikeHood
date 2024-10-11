import { LuBike, LuLeaf, LuUsers } from "react-icons/lu";
import { FaCarOn } from "react-icons/fa6";
import { TbRoadOff } from "react-icons/tb";
import { GrCloudComputer } from "react-icons/gr";

const Info = () => {
    return (
        <section className="flex flex-col gap-40 w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">The Challenge</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center">
                <FaCarOn className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Transport Issues</h3>
                <p className="text-gray-600">Ireland faces increasing traffic congestion, pollution, and inequality due to unsustainable road transport.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <TbRoadOff className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Lack of Infrastructure</h3>
                <p className="text-gray-600">Insufficient cyclist-friendly infrastructure and minimal promotion of cycling and walking hinder sustainable transport.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <LuLeaf className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Environmental Impact</h3>
                <p className="text-gray-600">The current system contributes significantly to carbon emissions and poor air quality, affecting public health and community well-being.</p>
              </div>
            </div>
          </div>
          <div className="px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">The Solution</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center">
                <LuBike className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Cycling Neighbourhood</h3>
                <p className="text-gray-600">BikeHood aims to create Ireland's first cycling neighbourhood, transforming transport by promoting cycling and walking.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <LuUsers className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Community Engagement</h3>
                <p className="text-gray-600">By involving stakeholders and addressing barriers like inadequate infrastructure, BikeHood fosters community-centric sustainable transport solutions.</p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <GrCloudComputer className="h-12 w-12 text-green-600" />
                <h3 className="text-xl font-bold">Smart Technology Integration</h3>
                <p className="text-gray-600">The project uses smart mobility solutions, real-time data collection, and digital twin technology for experimentation and optimisation.</p>
              </div>
            </div>
          </div>
        </section>
    )
}

export default Info