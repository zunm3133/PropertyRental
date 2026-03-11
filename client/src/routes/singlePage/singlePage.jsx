import "./singlePage.scss";
import Map from "../../components/map/Map";
import { useNavigate, useLoaderData, Link } from "react-router-dom";
import DOMPurify from "dompurify";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import MaintenanceForm from "../../components/maintenanceForm/MaintenanceForm";

function SinglePage() {
  const post = useLoaderData();
  const [saved, setSaved] = useState(post.isSaved);
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [imageIndex, setImageIndex] = useState(null);
  const [isAvailable, setIsAvailable] = useState(post.isAvailable);
  const [modalConfig, setModalConfig] = useState(null); 
  const closePopup = () => setModalConfig(null);
  const initialRequest = currentUser 
    ? post.rentals?.find(r => r.tenantId === currentUser.id) 
    : null;
  const [requestStatus, setRequestStatus] = useState(initialRequest?.status || null);

  const isOwner = currentUser && currentUser.id === post.userId;
  const hasActiveLease = post.rentals?.some(rental => rental.status === "accepted");
  const showRented = !isAvailable || hasActiveLease;
  
  const isPending = requestStatus === "pending";
  const isTenant = requestStatus === "accepted";

  const handleDelete = () => {
    if (!isAvailable || hasActiveLease) return; 

    setModalConfig({
      type: "confirm",
      message: "Are you sure you want to delete this property? This action cannot be undone.",
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.delete("/posts/" + post.id);
          navigate("/profile"); 
        } catch (err) {
          console.log(err);
          setModalConfig({ type: "alert", message: err.response?.data?.message || "Failed to delete post" });
        }
      }
    });
  };
 
  const handleToggleAvailability = () => {
    if (hasActiveLease) return;

    const confirmMsg = isAvailable 
      ? "Are you sure you want to mark this property as RENTED? It will be hidden from search results." 
      : "Are you sure you want to mark this property as AVAILABLE again?";

    setModalConfig({
      type: "confirm",
      message: confirmMsg,
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.put("/posts/" + post.id, { isAvailable: !isAvailable });
          setIsAvailable((prev) => !prev); 
        } catch (err) {
          console.log(err);
          setModalConfig({ type: "alert", message: "Failed to update status" });
        }
      }
    });
  };

  const handleRentalRequest = async () => {
    if (!currentUser) return navigate("/login");
    if (showRented || isPending || isTenant) return; 

    try {
      await apiRequest.post("/requests/rental", {
        postId: post.id,
        ownerId: post.userId,
      });
      setModalConfig({ type: "alert", message: "Rental request sent to owner!" });
      setRequestStatus("pending"); 
    } catch (err) {
      console.log(err);
      setModalConfig({ type: "alert", message: err.response?.data?.message || "Failed to send request." });
    }
  };

  const handleSave = async () => {
    if (!currentUser) return navigate("/login");
    setSaved((prev) => !prev);
    try {
      await apiRequest.post("/users/save", { postId: post.id });
    } catch (err) {
      console.log(err);
      setSaved((prev) => !prev);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) return navigate("/login");
    
    if (currentUser.isRestricted) {
      return setModalConfig({ type: "alert", message: "🚫 ACCOUNT RESTRICTED\n\nYou have been restricted from starting new conversations." });
    }
    if (currentUser.id === post.userId) {
      return setModalConfig({ type: "alert", message: "You cannot send a message to yourself!" });
    }

    try {
      const res = await apiRequest.post("/chats", { receiverId: post.userId });
      if (res.status === 200 || res.status === 201) {
        navigate("/profile");
      }
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 403) {
        setModalConfig({ type: "alert", message: "🚫 ACCOUNT RESTRICTED\n\nYou cannot start chats due to abusive behavior." });
      } else {
        navigate("/profile"); 
      }
    }
  };

  const handleOpenSlider = (index) => setImageIndex(index);
  const handleCloseSlider = () => setImageIndex(null);
  const handleSlide = (direction) => {
    if (direction === "left") {
      setImageIndex(imageIndex === 0 ? post.images.length - 1 : imageIndex - 1);
    } else {
      setImageIndex(imageIndex === post.images.length - 1 ? 0 : imageIndex + 1);
    }
  };

  let rentButtonText = "Rent Request";
  let isRentButtonDisabled = false;

  if (isTenant) {
    rentButtonText = "You are the Tenant";
    isRentButtonDisabled = true;
  } else if (isPending) {
    rentButtonText = "Request Pending";
    isRentButtonDisabled = true;
  } else if (showRented) {
    rentButtonText = "Currently Rented";
    isRentButtonDisabled = true;
  } 

  return (
    <div className="singlePage">
      
      {modalConfig && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <p>{modalConfig.message}</p>
            <div className="modal-actions">
              {modalConfig.type === "confirm" ? (
                <>
                  <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                  <button className="confirm-btn" onClick={modalConfig.onConfirm}>Yes, continue</button>
                </>
              ) : (
                <button className="ok-btn" onClick={closePopup}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="details">
        <div className="wrapper">
          {imageIndex !== null && (
            <div className="slider">
              <div className="fullSlider">
                <div className="arrow" onClick={() => handleSlide("left")}><img src="/arrow.png" alt="" /></div>
                <div className="imgContainer"><img src={post.images[imageIndex]} alt="" /></div>
                <div className="arrow" onClick={() => handleSlide("right")}><img src="/arrow.png" alt="" className="right" /></div>
                <div className="close" onClick={handleCloseSlider}>X</div>
              </div>
            </div>
          )}

          <div className="images">
            <div className="bigImage" onClick={() => handleOpenSlider(0)}>
               <img src={post.images[0]} alt="" />
            </div>
            <div className="smallImages">
              {post.images.slice(1, 4).map((image, index) => {
                const actualIndex = index + 1;
                const isLastSlot = index === 2;
                const remaining = post.images.length - 4;
                return (
                  <div className="smallImageWrapper" key={index} onClick={() => handleOpenSlider(actualIndex)}>
                    <img src={image} alt="" />
                    {isLastSlot && remaining > 0 && <div className="overlay">+{remaining} photos</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="info">
            <div className="top">
              <div className="post">
                <h1>{post.title}</h1>
                <div className="address">
                  <img src="/pin.png" alt="" />
                  <span>{post.address}</span>
                </div>
                <div className="price-container">
                    <div className="price-tag">$ {post.price.toLocaleString()}</div>
                    {showRented ? (<div className="status-badge rented">Rented</div>) : (<div className="status-badge available">Available</div>)}
                </div>
              </div>
              <div className="user-card">
                <img src={post.user.avatar || "/noavatar.jpg"} alt="" />
                <div className="user-details">
                   <span>{post.user.username}</span>
                   <span className="role">Property Owner</span>
                </div>
              </div>
            </div>
            <div className="bottom-desc" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.desc) }}></div>
          </div>
        </div>
      </div>

      <div className="features">
        <div className="wrapper">
          <p className="title">Overview</p>
          <div className="listVertical">
            <div className="feature">
              <img src="/utility.png" alt="" />
              <div className="featureText">
                <span>Utilities</span>
                <p>{post.utilities === "owner" ? "Owner Responsible" : "Tenant Responsible"}</p>
              </div>
            </div>
            <div className="feature">
              <img src="/pet.png" alt="" />
              <div className="featureText">
                <span>Pet Policy</span>
                <p>{post.pet === "allowed" ? "Pets Allowed" : "No Pets"}</p>
              </div>
            </div>
            <div className="feature">
              <img src="/fee.png" alt="" />
              <div className="featureText">
                <span>Income Req</span>
                <p>{post.income}</p>
              </div>
            </div>
          </div>

          <p className="title">Dimensions</p>
          <div className="sizes-grid">
            <div className="size-card"><img src="/size.png" alt="" /><span>{post.size} sqft</span></div>
            <div className="size-card"><img src="/bed.png" alt="" /><span>{post.bedroom} Beds</span></div>
            <div className="size-card"><img src="/bath.png" alt="" /><span>{post.bathroom} Baths</span></div>
          </div>

          <p className="title">Nearby</p>
          <div className="listHorizontal">
            <div className="mini-feature"><img src="/school.png" alt="" /><div className="text"><span>School</span><p>{post.school > 999 ? (post.school/1000)+"km" : post.school+"m"}</p></div></div>
            <div className="mini-feature"><img src="/bus.png" alt="" /><div className="text"><span>Bus</span><p>{post.bus}m</p></div></div>
            <div className="mini-feature"><img src="/restaurant.png" alt="" /><div className="text"><span>Dine</span><p>{post.restaurant}m</p></div></div>
          </div>
          
          <p className="title">Location</p>
          <div className="mapContainer"><Map items={[post]} /></div>

          <div className="buttons">
            {!isOwner ? (
              <>
              <button className="primary-btn" onClick={handleSendMessage}><img src="/chat.png" alt="" /> Message Owner</button>
              <button 
                className={`secondary-btn ${isRentButtonDisabled ? "disabled" : ""}`} 
                onClick={handleRentalRequest} 
                disabled={isRentButtonDisabled}
              >
                {rentButtonText}
              </button>
              </>
            ) : (
              <div className="owner-actions">
                <Link to={`/list/${post.id}/update`} style={{ width: "100%" }}><button className="btn-update" style={{width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid #cbd5e1"}}>Update Property</button></Link>
                
                <button 
                  className={`status-toggle-btn ${hasActiveLease ? "disabled" : (isAvailable ? "mark-rented" : "mark-available")}`}
                  onClick={handleToggleAvailability}
                  disabled={hasActiveLease}
                  title={hasActiveLease ? "You cannot mark as available while a tenant is active." : ""}
                >
                  {hasActiveLease ? "🔒 Active Lease (Locked)" : (isAvailable ? "⛔ Mark as Rented" : "✅ Mark as Available")}
                </button>

                <button 
                  className={`delete-btn ${!isAvailable ? "disabled" : ""}`} 
                  onClick={handleDelete} 
                  disabled={!isAvailable} 
                  title={!isAvailable ? "You cannot delete a rented property" : ""}
                  style={{padding: "16px", borderRadius: "12px", fontWeight: "bold"}}
                >
                  {!isAvailable ? "Delete Disabled (Active)" : "🗑 Delete Property"}
                </button>
              </div>
            )}
            <button onClick={handleSave} className={`save-btn ${saved ? "saved" : ""}`}>
              <img src="/save.png" alt="" style={{filter: saved ? "none" : "opacity(0.6)"}}/>
              {saved ? "Saved" : "Save to List"}
            </button>
          </div>
          {currentUser && post.isTenant && <MaintenanceForm postId={post.id} />}
        </div>
      </div>
    </div>
  );
}

export default SinglePage;