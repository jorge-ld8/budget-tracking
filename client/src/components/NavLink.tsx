import { Link } from 'react-router-dom';

type NavLinkProps = {
  to: string;
  children: React.ReactNode;
  mobile?: boolean;
  onClick?: () => void;
};

const NavLink = ({ to, children, mobile = false, onClick }: NavLinkProps) => {
  const baseStyles = "text-white hover:opacity-60 rounded-md font-medium transition-opacity duration-200";
  const desktopStyles = "px-3 py-2";
  const mobileStyles = "block px-3 py-2 text-base";
  
  const className = `${baseStyles} ${mobile ? mobileStyles : desktopStyles}`;
  
  return (
    <Link to={to} className={className} onClick={onClick}>
      {children}
    </Link>
  );
};

export default NavLink;
