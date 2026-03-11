import Chat from "../../components/chat/Chat";
import List from "../../components/list/List";
import "./profilePage.scss";
import apiRequest from "../../lib/apiRequest";
import { Await, Link, useLoaderData, useNavigate } from "react-router-dom";
import { Suspense, useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import Maintenance from "../../components/maintenance/Maintenance";
import RentalCard from "../../components/rentalCard/RentalCard";

function ProfilePage() {
  const data = useLoaderData();
  const { updateUser, currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("listings"); 

  const handleLogout = async () => {
    try {
      await apiRequest.post("/auth/logout");
      updateUser(null);
      navigate("/");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="profilePage">
      <div className="details">
        <div className="wrapper">
          
          <div className="title"><h1>My Profile</h1></div>
          
          <div className="userInfoCard">
            <div className="avatar-section">
              <img src={currentUser.avatar || "/noavatar.jpg"} alt="" />
              <div className="user-text">
                <h2>{currentUser.username}</h2>
                <p>{currentUser.email}</p>
              </div>
            </div>
            
            <div className="action-buttons">
              {currentUser.isAdmin && (
                <Link to="/admin"><button className="admin-btn">Admin Dashboard</button></Link>
              )}
              <Link to="/profile/update"><button className="update-btn">Edit Profile</button></Link>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          </div>

          <div className="tabs">
            <button 
              className={activeTab === "listings" ? "active" : ""} 
              onClick={() => setActiveTab("listings")}
            >
              My Listings
            </button>
            <button 
              className={activeTab === "saved" ? "active" : ""} 
              onClick={() => setActiveTab("saved")}
            >
              Saved Homes
            </button>
            
            <button 
              className={activeTab === "requests" ? "active" : ""} 
              onClick={() => setActiveTab("requests")}
            >
              Requests
            </button>
            <button 
              className={activeTab === "rented" ? "active" : ""} 
              onClick={() => setActiveTab("rented")}
            >
              Rented / Active
            </button>

            <button 
              className={activeTab === "maintenance" ? "active" : ""} 
              onClick={() => setActiveTab("maintenance")}
            >
              Maintenance
            </button>
          </div>

          <div className="tab-content">
            
            {activeTab === "listings" && (
              <div className="section fade-in">
                <div className="title">
                  <h1>My Listings</h1>
                  <Link to="/add"><button className="create-btn">+ Create New Post</button></Link>
                </div>
                <Suspense fallback={<div className="loading">Loading Listings...</div>}>
                  <Await resolve={data.postResponse} errorElement={<p>Error loading posts!</p>}>
                    {(postResponse) => <List posts={postResponse.data.userPosts} />}
                  </Await>
                </Suspense>
              </div>
            )}

            {activeTab === "saved" && (
              <div className="section fade-in">
                <div className="title"><h1>Saved Homes</h1></div>
                <Suspense fallback={<div className="loading">Loading Saved...</div>}>
                  <Await resolve={data.postResponse} errorElement={<p>Error loading posts!</p>}>
                    {(postResponse) => <List posts={postResponse.data.savedPosts} />}
                  </Await>
                </Suspense>
              </div>
            )}

            {activeTab === "requests" && (
              <div className="section fade-in">
                <div className="title"><h1>Pending Applications</h1></div>
                <Suspense fallback={<div className="loading">Loading Requests...</div>}>
                  <Await resolve={data.rentalResponse} errorElement={<p>Error loading rentals!</p>}>
                    {(rentalResponse) => {
                      const allRentals = rentalResponse.data || rentalResponse;
                      const pendingRequests = allRentals.filter(r => r.status !== "accepted");

                      return (
                        <div className="rentalList">
                          {pendingRequests.map((rental) => (
                            <RentalCard key={rental.id} item={rental} currentUser={currentUser} />
                          ))}
                          {pendingRequests.length === 0 && (
                            <div className="empty-state">No pending applications.</div>
                          )}
                        </div>
                      );
                    }}
                  </Await>
                </Suspense>
              </div>
            )}

            {activeTab === "rented" && (
              <div className="section fade-in">
                <div className="title"><h1>Active Leases</h1></div>
                <Suspense fallback={<div className="loading">Loading Leases...</div>}>
                  <Await resolve={data.rentalResponse} errorElement={<p>Error loading rentals!</p>}>
                    {(rentalResponse) => {
                      const allRentals = rentalResponse.data || rentalResponse;
                      
                      const activeLeases = allRentals.filter(r => r.status === "accepted");

                      return (
                        <div className="rentalList">
                          {activeLeases.map((rental) => (
                            <RentalCard 
                              key={rental.id} 
                              item={rental} 
                              currentUser={currentUser} 
                            />
                          ))}
                          {activeLeases.length === 0 && (
                            <div className="empty-state">No active leases currently.</div>
                          )}
                        </div>
                      );
                    }}
                  </Await>
                </Suspense>
              </div>
            )}

            {activeTab === "maintenance" && (
              <div className="section fade-in">
                <div className="title"><h1>Maintenance Tickets</h1></div>
                <Suspense fallback={<div className="loading">Loading Maintenance...</div>}>
                  <Await resolve={data.maintenanceResponse} errorElement={<p>Error loading requests!</p>}>
                    {(maintenanceResponse) => (
                      <div className="maintenanceList">
                        {maintenanceResponse.data.map((req) => (
                          <Maintenance key={req.id} item={req} currentUser={currentUser} />
                        ))}
                        {maintenanceResponse.data.length === 0 && (
                          <div className="empty-state">No active maintenance tickets.</div>
                        )}
                      </div>
                    )}
                  </Await>
                </Suspense>
              </div>
            )}

          </div>
        </div>
      </div>

      <div className="chatContainer">
        <div className="wrapper">
          <Suspense fallback={<div className="loading">Loading Chats...</div>}>
            <Await resolve={data.chatResponse} errorElement={<p>Error loading chats!</p>}>
              {(chatResponse) => <Chat chats={chatResponse.data} />}
            </Await>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;