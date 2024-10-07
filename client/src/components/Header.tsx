import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
    const navigate = useNavigate();
    return (
        <>
        <div className="font-nunito bg-white border-b border-[#635BFF] min-h-20 left-0 w-full flex justify-between items-center py-4 px-4 md:px-20 shadow-md">
        <h1 className="text-4xl text-[#635bffd0]">
          BikeHood
        </h1>
        <div className="flex space-x-4 items-center text-[#0A2540] text-lg">
            <button onClick={() => navigate("/about")}>
            About
            </button>
            <button onClick={() => navigate("/twin")}>
            Twin
            </button>
            <button onClick={() => navigate("/data")}> 
            Data
            </button>
        </div>
        </div>      
      </>
    )
}

export default Header