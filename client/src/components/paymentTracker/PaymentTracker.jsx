import { useState } from "react";
import apiRequest from "../../lib/apiRequest";
import "./paymentTracker.scss";

function PaymentTracker({ payments, isOwner, onUpdate }) {
  const [loadingId, setLoadingId] = useState(null);

 
  const total = payments.length;
  const paidCount = payments.filter(p => p.status === "paid").length;
  const progressPercentage = Math.round((paidCount / total) * 100);

  const handleToggle = async (payment) => {
    if (!isOwner) return;

    setLoadingId(payment.id);
    const newStatus = payment.status === "paid" ? "pending" : "paid";

    try {
      await apiRequest.put(`/rentals/payment/${payment.id}`, { status: newStatus });
      onUpdate();
    } catch (err) {
      console.log(err);
      alert("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="paymentTracker">
      <div className="tracker-header">
        <div className="title-section">
          <h3>Payment Ledger</h3>
          <span className="subtitle">{paidCount}/{total} Months Paid</span>
        </div>
        
        
        <div className="progress-container">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid">
        {payments.map((p) => {
          const dateObj = new Date(p.date);
          const month = dateObj.toLocaleDateString("en-US", { month: 'short' });
          const year = dateObj.toLocaleDateString("en-US", { year: '2-digit' });
          
          return (
            <div 
              key={p.id} 
              className={`monthBox ${p.status} ${isOwner ? "clickable" : ""} ${loadingId === p.id ? "loading" : ""}`}
              onClick={() => handleToggle(p)}
              title={isOwner ? "Click to toggle status" : ""}
            >
              <div className="box-content">
                <span className="month">{month}</span>
                <span className="year">'{year}</span>
                
                
                <div className="status-icon">
                   {loadingId === p.id ? (
                     <div className="spinner"></div>
                   ) : p.status === "paid" ? (
                     "✔" 
                   ) : (
                     "!"
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentTracker;