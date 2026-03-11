import apiRequest from "../../lib/apiRequest";
import "./requestList.scss";

function RequestList({ data, isOwner }) {
  const handleStatus = async (id, status) => {
    try {
      await apiRequest.patch(`/requests/rental/${id}`, { status });
      window.location.reload();
    } catch (err) { console.log(err); }
  };

  return (
    <div className="requestList">
      {data.length === 0 ? (
        <div className="empty-state">No active requests found.</div>
      ) : (
        data.map((req) => (
          <div key={req.id} className={`requestItem ${req.status}`}>
            <div className="info">
              <div className="icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              </div>
              <div className="text-content">
                <span className="id-label">Property Request #{req.postId}</span>
                <span className="status-label">Status: <b>{req.status}</b></span>
              </div>
            </div>

            {isOwner && req.status === "pending" && (
              <div className="buttons">
                <button className="accept-btn" onClick={() => handleStatus(req.id, "accepted")}>
                  Accept
                </button>
                <button className="deny-btn" onClick={() => handleStatus(req.id, "denied")}>
                  Deny
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default RequestList;