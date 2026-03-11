import { useEffect, useState } from "react";
import apiRequest from "../../lib/apiRequest";
import "./flaggedMessages.scss";

function FlaggedMessages() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await apiRequest.get("/messages/flagged");
      setReports(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleRestrict = async (userId) => {
    if (!window.confirm("Restrict this user from chatting?")) return;
    try {
      await apiRequest.put(`/users/restrict/${userId}`);
      alert("User has been restricted!");
      fetchReports(); 
    } catch (err) {
      alert("Error restricting user");
    }
  };

  return (
    <div className="flaggedPage">
      <h1>Abusive Language Reports</h1>
      <div className="list">
        {reports.map((msg) => (
          <div key={msg.id} className="reportCard">
            <div className="info">
              <span className="badWord">"{msg.text}"</span>
              <p>Sent by: <b>{msg.sender.username}</b></p>
              <p className="date">{new Date(msg.createdAt).toDateString()}</p>
            </div>
            <div className="actions">
              {msg.sender.isRestricted ? (
                <button disabled className="restrictedBtn">Restricted</button>
              ) : (
                <button onClick={() => handleRestrict(msg.userId)} className="banBtn">
                  Restrict User
                </button>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && <p>No flagged messages found.</p>}
      </div>
    </div>
  );
}

export default FlaggedMessages;