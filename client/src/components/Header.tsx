import { LuBike } from "react-icons/lu";
import { NavLink } from "react-router-dom"; // Import NavLink for active styles

const Header: React.FC = () => {
  return (
    <> 
      <header className="font-nunito px-4 lg:px-6 h-14 flex items-center justify-center">
        {/* Logo Button */}
        <NavLink to="/" className="flex items-center justify-center">
          <LuBike className="h-6 w-6 text-green-600" />
          <span className="ml-2 text-2xl font-bold text-gray-900">BikeHood</span>
        </NavLink>
        
        {/* Navigation Menu */}
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <NavLink 
            to="/about" 
            className={({ isActive }) =>
              `text-lg font-medium hover:underline underline-offset-4 ${
                isActive ? 'text-blue-600' : 'text-gray-900'
              }`
            }
          >
            About
          </NavLink>
          <NavLink 
            to="/twin" 
            className={({ isActive }) =>
              `text-lg font-medium hover:underline underline-offset-4 ${
                isActive ? 'text-blue-600' : 'text-gray-900'
              }`
            }
          >
            Twin
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) =>
              `text-lg font-medium hover:underline underline-offset-4 ${
                isActive ? 'text-blue-600' : 'text-gray-900'
              }`
            }
          >
            Contact
          </NavLink>
        </nav>
      </header>
    </>
  );
};

export default Header;
