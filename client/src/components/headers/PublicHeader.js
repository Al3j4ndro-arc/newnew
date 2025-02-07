import React from 'react';
// import Logo from "../../assets/logos/mcg-long-logo-noback.png"
import { Link } from "react-router-dom"
import { useState } from 'react';

export default function PublicHeader() {
  const [navbarOpen, setNavbarOpen] = useState(false);
  return (
    <nav className="text-xl bg-white border-gray-200 relative flex flex-wrap items-center justify-between px-2 py-3 mb-3">
      <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
        <div className="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start">
          <a href="https://mitconsulting.group/" className="flex items-center">
            {/* <img src={Logo} className="h-8 mr-3" alt="MCG Logo" /> */}
          </a>
          <button
            className="text-white cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
            type="button"
            onClick={() => setNavbarOpen(!navbarOpen)}
          >
            <svg className="w-6 h-6" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path></svg>
          </button>
        </div>
        <div
          className={
            "lg:flex flex-grow items-center" +
            (navbarOpen ? " flex" : " hidden")
          }
        >
          <ul className="flex flex-col lg:flex-row list-none lg:ml-auto mt-2 lg:mt-0">
            <li className="nav-item ">
              <Link to="/publicevents" className='px-3 py-1 flex items-center leading-snug text-white hover:opacity-75'>
                <span
                  className="block pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-red-700 md:p-0"                >Events</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/login" className='px-3 py-1 flex items-center leading-snug text-white hover:opacity-75'>
                <span
                  className="block pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-red-700 md:p-0"                >Login</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/signup" className='px-3 py-1 flex items-center leading-snug text-white hover:opacity-75'>
                <span
                  className="block pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-red-700 md:p-0"                >Sign Up</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}