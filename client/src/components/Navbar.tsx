import { useState } from 'react';
import { Link } from 'react-router-dom';
import NavLink from './NavLink';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout } = useAuth();
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-white font-bold text-xl">BudgetApp</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/accounts">Accounts</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/budgets">Budgets</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <button className="text-white hover:text-white hover:opacity-50 px-3 py-2 rounded-md font-medium transition-colors duration-200" onClick={() => logout()}>
              Logout
            </button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button 
              onClick={toggleMenu}
              className="text-white hover:bg-green-700 p-2 rounded-md transition-colors duration-200"
              aria-expanded={isMenuOpen}
            >
              <svg 
                className="h-6 w-6" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute w-full bg-darkgreen shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/accounts">Accounts</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/budgets">Budgets</NavLink>
            <NavLink to="/reports">Reports</NavLink>
            <button 
              className="mt-3 w-full bg-white text-darkgreen hover:bg-gray-200 px-4 py-2 rounded-md font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 