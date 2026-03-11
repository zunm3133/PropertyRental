import { useState } from "react";
import apiRequest from "../../lib/apiRequest";
import "./maintenanceForm.scss";

function MaintenanceForm({ postId }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.target);
    const description = formData.get("description");

    try {
      await apiRequest.post("/requests/maintenance", { postId, description });
      setSuccess("Ticket #Created! Help is on the way.");
      setError("");
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit ticket.");
      setSuccess("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="maintenanceForm">
      <div className="ticket-header">
        <div className="icon-circle">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <div className="text">
          <h3>Maintenance Support</h3>
          <p>Describe the issue and we'll fix it.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea 
            name="description" 
            placeholder="e.g. The air conditioner in the master bedroom is leaking water..." 
            required 
          />
        </div>
        
        <button type="submit" disabled={isLoading} className={isLoading ? "loading" : ""}>
          {isLoading ? "Submitting Ticket..." : "Send Request"}
        </button>
        
        {error && (
          <div className="status-msg error">
            <span>⚠</span> {error}
          </div>
        )}
        {success && (
          <div className="status-msg success">
            <span>✔</span> {success}
          </div>
        )}
      </form>
    </div>
  );
}

export default MaintenanceForm;