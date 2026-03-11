import { useContext, useState } from "react";
import "./navbar.scss";
import { Link, NavLink } from "react-router-dom"; 
import { AuthContext } from "../../context/AuthContext";
import { useNotificationStore } from "../../lib/notificationStore";

function Navbar() {
  const [open, setOpen] = useState(false);
  const { currentUser } = useContext(AuthContext);

  const fetch = useNotificationStore((state) => state.fetch);
  const number = useNotificationStore((state) => state.number);

  if(currentUser) fetch();

  return (
    <nav>
      <div className="left">
        <Link to="/" className="logo">
          <img src="/home-page.png" alt="" />
          <span>PRMS</span>
        </Link>
        <div className="links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/list">Listings</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
        </div>
      </div>

      <div className="right">
        {currentUser ? (
          <div className="user">
            <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
            <span className="username">{currentUser.username}</span>
            <Link to="/profile" className="profileBtn">
              {number > 0 && <div className="notification">{number}</div>}
              <span>Profile</span>
            </Link>
          </div>
        ) : (
          <>
            <Link to="/login" className="login links">Sign in</Link>
            <Link to="/register" className="register">Sign up</Link>
          </>
        )}
        
        <div className="menuIcon">
          <img
            src="/menu.png"
            alt=""
            onClick={() => setOpen((prev) => !prev)}
          />
        </div>

        <div className={open ? "menu active" : "menu"}>
          <NavLink to="/" onClick={() => setOpen(false)}>Home</NavLink>
          <NavLink to="/list" onClick={() => setOpen(false)}>Listings</NavLink>
          <NavLink to="/about" onClick={() => setOpen(false)}>About</NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)}>Contact Us</NavLink>
          <div className="mobile-auth">
             {!currentUser && <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>}
             {!currentUser && <Link to="/register" onClick={() => setOpen(false)}>Sign up</Link>}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;