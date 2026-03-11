import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./rentalCard.scss";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../uploadWidget/UploadWidget";
import PaymentTracker from "../paymentTracker/PaymentTracker";
import { jsPDF } from "jspdf";

function RentalCard({ item, currentUser }) {
  const [error, setError] = useState("");
  const [signedFile, setSignedFile] = useState([]);

  
  const [modalConfig, setModalConfig] = useState(null);
  const closePopup = () => setModalConfig(null);

  const [dates, setDates] = useState({
    startDate: item.startDate ? item.startDate.split('T')[0] : "",
    endDate: item.endDate ? item.endDate.split('T')[0] : ""
  });
  
  const [ownerLegalName, setOwnerLegalName] = useState(item.ownerLegalName || "");
  const [tenantLegalName, setTenantLegalName] = useState(item.tenantLegalName || "");

  const isOwner = currentUser.id === item.ownerId;
  const isTenant = currentUser.id === item.tenantId;

  const handleGenerateLease = async () => {
    if (!dates.startDate || !dates.endDate) {
      setError("Please select the Start and End dates before generating the lease.");
      return;
    }
    
    if (!ownerLegalName || !tenantLegalName) {
      setError("Please enter the Legal Names for both the Owner and Tenant.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text("RESIDENTIAL LEASE AGREEMENT", 105, 20, null, null, "center");
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
      doc.setFont("helvetica", "bold");
      doc.text("1. PARTIES", 20, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`This Lease Agreement is made between:`, 20, 65);
      doc.text(`Landlord (Owner): ${ownerLegalName}`, 30, 75);
      doc.text(`Tenant: ${tenantLegalName}`, 30, 85); 
      doc.setFont("helvetica", "bold");
      doc.text("2. PROPERTY", 20, 100);
      doc.setFont("helvetica", "normal");
      doc.text(`Address: ${item.post.address}`, 20, 110);
      doc.text(`Property Title: ${item.post.title}`, 20, 120);
      doc.setFont("helvetica", "bold");
      doc.text("3. TERM", 20, 135);
      doc.setFont("helvetica", "normal");
      doc.text(`Lease Start Date: ${dates.startDate}`, 30, 145);
      doc.text(`Lease End Date: ${dates.endDate}`, 30, 155);
      doc.setFont("helvetica", "bold");
      doc.text("4. RENT", 20, 170);
      doc.setFont("helvetica", "normal");
      doc.text(`Monthly Rent: $${item.post.price}`, 30, 180);
      doc.line(20, 200, 190, 200);
      doc.text("By signing below, the Tenant agrees to the terms of this lease.", 20, 215);
      doc.text("Tenant Signature: ___________________________", 20, 240);
      doc.text("Date: _________________", 130, 240);

      const pdfBase64 = doc.output("datauristring");

      await apiRequest.patch(`/requests/rental/${item.id}`, {
        leaseUrl: pdfBase64,
        status: "awaiting_signature",
      });

      await apiRequest.put(`/rentals/${item.id}`, {
        status: "awaiting_signature",
        startDate: new Date(dates.startDate).toISOString(), 
        endDate: new Date(dates.endDate).toISOString(),
        ownerLegalName,
        tenantLegalName
      });
      
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 401 ? "Session expired. Please log in again." : "Failed to generate lease.");
    }
  };

  useEffect(() => {
    const uploadSigned = async () => {
      if (signedFile.length > 0) {
        try {
          await apiRequest.patch(`/requests/rental/${item.id}`, {
            signedLeaseUrl: signedFile[0],
            status: "ready_for_review",
          });
          window.location.reload();
        } catch (err) { 
          setError("Failed to upload signed lease."); 
        }
      }
    };
    uploadSigned();
  }, [signedFile, item.id]);

  const handleAccept = async () => {
    try {
      await apiRequest.put(`/rentals/${item.id}`, {
        status: "accepted",
        startDate: item.startDate, 
        endDate: item.endDate,
        price: item.post.price 
      });
      window.location.reload();
    } catch (err) { 
      setError(err.response?.data?.message || "Error accepting lease."); 
    }
  };

  
  const handleReject = () => {
    setModalConfig({
      type: "confirm",
      message: "Are you sure you want to reject this application?",
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.patch(`/requests/rental/${item.id}`, { status: "rejected" });
          window.location.reload();
        } catch (err) { 
          setError("Failed to reject rental application."); 
        }
      }
    });
  };

  
  const handleEndLease = () => {
    const today = new Date();
    const leaseEndDate = new Date(item.endDate);

    if (today < leaseEndDate) {
      setModalConfig({
        type: "alert",
        message: `You cannot end this lease yet. The rental period officially ends on ${leaseEndDate.toLocaleDateString()}.`
      });
      return; 
    }

    setModalConfig({
      type: "confirm",
      message: "Are you sure you want to END this lease? This action cannot be undone.",
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.put(`/rentals/${item.id}`, { status: "completed" });
          window.location.reload();
        } catch (err) { 
          setModalConfig({ type: "alert", message: "Failed to end lease." });
        }
      }
    });
  };

  const formatStatus = (status) => status.replace(/_/g, " ").toUpperCase();

  const getDownloadUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("data:") ? url : url.replace("/upload/", "/upload/fl_attachment/");
  };

  return (
    <div className="rentalCard">
      
      
      {modalConfig && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <p>{modalConfig.message}</p>
            <div className="modal-actions">
              {modalConfig.type === "confirm" ? (
                <>
                  <button className="cancel-btn" onClick={closePopup}>Cancel</button>
                  <button className="confirm-btn" onClick={modalConfig.onConfirm}>OK</button>
                </>
              ) : (
                <button className="ok-btn" onClick={closePopup}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card-content">
        <div className="header">
          <div className="image-wrapper">
            <img src={item.post.images[0]} alt="" />
          </div>
          <div className="info">
            <Link to={`/${item.postId}`} className="post-title">
              <h3>{item.post.title}</h3>
            </Link>
            <div className="status-row">
                 <span className={`status-pill ${item.status}`}>
                  {formatStatus(item.status)}
                </span>
                <span className="rent-price">${item.post.price}/mo</span>
            </div>
          </div>
        </div>

        {isOwner && item.tenant && (
            <div className="user-info-row">
                <div className="user-profile">
                    <img src={item.tenant.avatar || "/noavatar.jpg"} alt="" />
                    <div className="user-text">
                        <span className="label">Applicant</span>
                        <span className="name">{item.tenant.username}</span>
                    </div>
                </div>
            </div>
        )}

        <div className="action-panel">
          {item.status === "pending" && (
            <div className="step-content">
              {isOwner ? (
                <>
                  <p className="instruction">1. Enter Legal Names for the Contract.</p>
                  <div className="date-picker-group" style={{marginBottom: "15px", display: "flex", flexDirection: "column", gap: "10px"}}>
                    <div className="inputs" style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
                      <label>Owner Legal Name:</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Darren"
                        value={ownerLegalName} 
                        onChange={(e) => setOwnerLegalName(e.target.value)} 
                        style={{width: "100%", marginBottom: "10px"}}
                      />
                      <label>Tenant Legal Name:</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="e.g. Darren"
                        value={tenantLegalName} 
                        onChange={(e) => setTenantLegalName(e.target.value)} 
                        style={{width: "100%"}}
                      />
                    </div>
                  </div>

                  <p className="instruction">2. Set the rental period.</p>
                  <div className="date-picker-group" style={{marginBottom: "15px"}}>
                    <div className="inputs">
                      <label>Start:</label>
                      <input 
                        type="date" 
                        required 
                        value={dates.startDate} 
                        onChange={(e) => setDates(prev => ({ ...prev, startDate: e.target.value }))} 
                      />
                      <label>End:</label>
                      <input 
                        type="date" 
                        required 
                        value={dates.endDate} 
                        onChange={(e) => setDates(prev => ({ ...prev, endDate: e.target.value }))} 
                      />
                    </div>
                  </div>
                  <p className="instruction">3. Actions</p>
                  <div className="btn-group">
                    <button onClick={handleGenerateLease} className="btn primary-btn">Generate Lease</button>
                    <button onClick={handleReject} className="btn reject-btn">Reject</button>
                  </div>
                </>
              ) : (
                <div className="waiting-state">
                    <p className="waiting-text">Application Pending</p>
                    <small>The owner is reviewing your request.</small>
                </div>
              )}
            </div>
          )}
          
          {item.status === "awaiting_signature" && (
            <div className="step-content">
              {isTenant ? (
                <>
                  <p className="instruction">Action Required: Sign Lease</p>
                  <div className="lease-dates-preview">
                     <span>Period: {dates.startDate} to {dates.endDate}</span>
                  </div>
                  <div className="btn-group">
                    <a href={item.leaseUrl} download={`Lease_${item.id}.pdf`} className="btn secondary-btn">
                        Download PDF
                    </a>
                    <div className="upload-wrapper">
                         <UploadWidget 
                            uwConfig={{ cloudName: "dkmd2kobp", uploadPreset: "property_rental", folder: "signed_leases", multiple: false }} 
                            setState={setSignedFile} 
                        />
                        <span style={{fontSize: '12px', marginLeft: '10px'}}>Upload Signed PDF</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="waiting-text">Waiting for tenant to sign the lease.</p>
              )}
            </div>
          )}

          {item.status === "ready_for_review" && (
            <div className="step-content">
              {isOwner ? (
                <>
                  <p className="instruction">Tenant has signed. Review & Accept.</p>
                  <div className="doc-preview">
                      <a href={getDownloadUrl(item.signedLeaseUrl)} target="_blank" rel="noreferrer" className="doc-link">
                        📄 View Signed Document
                      </a>
                  </div>
                  <button onClick={handleAccept} className="btn primary-btn full-width">Finalize Lease</button>
                </>
              ) : (
                <p className="waiting-text">Owner is reviewing your signed lease.</p>
              )}
            </div>
          )}

          {item.status === "accepted" && (
            <div className="step-content active-deal">
              <div className="success-banner">
                 <span className="check">✔</span> Lease Active
              </div>
              <div className="lease-info-grid">
                 <div className="info-item">
                    <label>Start Date</label>
                    <span>{new Date(item.startDate).toLocaleDateString()}</span>
                 </div>
                 <div className="info-item">
                    <label>End Date</label>
                    <span>{new Date(item.endDate).toLocaleDateString()}</span>
                 </div>
                 <div className="info-item full">
                    <a href={getDownloadUrl(item.signedLeaseUrl)} target="_blank" rel="noreferrer">View Contract</a>
                 </div>
              </div>
              
              {item.payments && item.payments.length > 0 && (
                <div className="payment-wrapper">
                  <PaymentTracker payments={item.payments} isOwner={isOwner} onUpdate={() => window.location.reload()} />
                </div>
              )}
              
              {isOwner && (
                <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0'}}>
                   <button onClick={handleEndLease} className="btn outline-btn danger full-width">End Lease</button>
                </div>
              )}
            </div>
          )}
          
          {item.status === "completed" && (
            <div className="step-content">
              <div className="success-banner completed">
                 <span>🏁</span> Lease Completed
              </div>
            </div>
          )}

          

          {error && <div className="error-msg">{error}</div>}
        </div>
      </div>
    </div>
  );
}

export default RentalCard;