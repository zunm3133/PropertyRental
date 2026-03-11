import { Link, useNavigate } from "react-router-dom";
import "./card.scss";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";

function Card({ item }) {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [saved, setSaved] = useState(item.isSaved || false);
  
  useEffect(() => {
    setSaved(item.isSaved);
  }, [item.isSaved]);

  const isOwner = currentUser && currentUser.id === item.userId;
  const activeLease = item.rentals?.find(rental => rental.status === "accepted");
  const showRented = !item.isAvailable || activeLease;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return navigate("/login");
    
    setSaved((prev) => !prev);
    
    try {
      await apiRequest.post("/users/save", { postId: item.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!currentUser) return navigate("/login");
    
    try {
      await apiRequest.post("/chats", { receiverId: item.userId });
      navigate("/profile");
    } catch (err) {
      console.log(err);
      navigate("/profile");
    }
  };

  return (
    <div className="card">
      <Link to={`/${item.id}`} className="imageContainer">
        <img src={item.images[0] || "/no-image.jpg"} alt={item.title} />
        {showRented && (
          <div className="rentedBadge">
            <span className="statusText">RENTED</span>
            {activeLease?.endDate && (
              <span className="dateText">
                Until {new Date(activeLease.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </Link>
      
      <div className="textContainer">
        <h2 className="title">
          <Link to={`/${item.id}`}>{item.title}</Link>
        </h2>
        
        <p className="address">
          <img src="/pin.png" alt="" />
          <span>{item.address}</span>
        </p>
        
        <p className="price">$ {item.price.toLocaleString()}</p>
        
        <div className="bottom">
          <div className="features">
            <div className="feature">
              <img src="/bed.png" alt="" />
              <span>{item.bedroom} bed</span>
            </div>
            <div className="feature">
              <img src="/bath.png" alt="" />
              <span>{item.bathroom} bath</span>
            </div>
          </div>
          
          {!isOwner && (
            <div className="icons">
              <button 
                className={`icon ${saved ? "saved" : ""}`} 
                onClick={handleSave}
              >
                <img src="/save.png" alt="Save" />
              </button>
              
              <button className="icon" onClick={handleChat}>
                <img src="/chat.png" alt="Chat" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;