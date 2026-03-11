import { useState } from "react";
import "./maintenance.scss";
import apiRequest from "../../lib/apiRequest";

function Maintenance({ item, currentUser }) {
  const [status, setStatus] = useState(item.status);

  
  const isOwner = currentUser.id === item.post.userId;

  const handleStatusChange = async (newStatus) => {
    try {
      await apiRequest.patch(`/requests/maintenance/${item.id}`, {
        status: newStatus,
      });
      setStatus(newStatus);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className={`maintenance ${status}`}>
      <div className="imageContainer">
        <img src={item.post.images[0] || "/noavatar.jpg"} alt="" />
        <div className="overlay"></div>
      </div>

      <div className="contentContainer">
        <div className="header">
          <div className="title-section">
            <span className="icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            </span>
            <span className="propertyTitle">{item.post.title}</span>
          </div>
          
          <span className={`statusBadge ${status}`}>
            {status.replace("_", " ")}
          </span>
        </div>
        
        <div className="description-box">
          <span className="label">ISSUE REPORT</span>
          <p>"{item.description}"</p>
        </div>

       
        <div className="footer">
          {isOwner ? (
            <div className="owner-actions">
              <label>Update Progress:</label>
              <div className="select-wrapper">
                <select 
                  value={status} 
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={status}
                >
                  <option value="pending">⏳ Pending Review</option>
                  <option value="in_progress">🔧 In Progress</option>
                  <option value="completed">✔ Completed</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="tenant-view">
               <span className="status-dot"></span>
               <p>Status: <b>{status.replace("_", " ").toUpperCase()}</b></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Maintenance;