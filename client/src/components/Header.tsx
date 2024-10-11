import { LuBike } from "react-icons/lu";

const Header: React.FC = () => {
    return (
      <> 
      <header className="font-nunito px-4 lg:px-6 h-14 flex items-center justify-center">
        <button className="flex items-center justify-center">
          <LuBike className="h-6 w-6 text-green-600" />
          <span className="ml-2 text-2xl font-bold text-gray-900">BikeHood</span>
        </button>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <button className="text-lg font-medium hover:underline underline-offset-4">
            About
          </button>
          <button className="text-lg font-medium hover:underline underline-offset-4">
            Twin
          </button>
          <button className="text-lg font-medium hover:underline underline-offset-4">
            Contact
          </button>
        </nav>
      </header>
      </>
    )
}

export default Header