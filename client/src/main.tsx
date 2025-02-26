import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'rsuite/dist/rsuite.min.css';
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import ErrorPage from "./pages/ErrorPage";
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Data from './pages/Data';
// import Twin from './pages/Twin';
import TwinPage from './pages/Twin';

const router = createBrowserRouter([
  {
    element: <RootLayout/>,
    errorElement: <ErrorPage />, 
    children: [
      {
        path: "/",
        element: <LandingPage />,
        errorElement: <ErrorPage />
      },
      {
        path: "/about",
        element: <About />,
        errorElement: <ErrorPage />
      },
      {
        path: "/twin",
        element: <TwinPage />,
        errorElement: <ErrorPage />
      },
      {
        path: "/data",
        element: <Data />,
        errorElement: <ErrorPage />
      }
    ]
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
