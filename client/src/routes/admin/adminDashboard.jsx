import { useEffect, useState, useContext } from "react";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "./adminDashboard.scss";

function AdminDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [data, setData] = useState({ users: [], posts: [], feedbacks: [], maintenance: [], reports: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("admins");
  const [editingPost, setEditingPost] = useState(null); 
  
 
  const [modalConfig, setModalConfig] = useState(null);
  const closePopup = () => setModalConfig(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminRes, reportsRes] = await Promise.all([
          apiRequest.get("/admin"),
          apiRequest.get("/messages/flagged")
        ]);
        
        setData({ ...adminRes.data, reports: reportsRes.data });
        setLoading(false);
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
  }, [navigate]);

  
  const totalUsers = data.users.length;
  const totalPosts = data.posts.length;
  const rentedPosts = data.posts.filter(p => !p.isAvailable).length;
  const occupancyRate = totalPosts > 0 ? Math.round((rentedPosts / totalPosts) * 100) : 0;
  const activeMaintenance = data.maintenance?.filter(m => m.status !== 'completed').length || 0;
  const activeReports = data.reports?.length || 0;

  
  const handleDelete = (type, id) => {
    if (type === "user" && id === currentUser.id) {
      setModalConfig({ type: "alert", message: "You cannot delete your own account." });
      return;
    }
    
    setModalConfig({
      type: "confirm",
      message: `Are you sure you want to delete this ${type}? This action cannot be undone.`,
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.delete(`/admin/${type}/${id}`);
          let stateKey;
          if (type === 'maintenance') stateKey = 'maintenance';
          else if (type === 'feedback') stateKey = 'feedbacks'; 
          else stateKey = `${type}s`;

          setData(prev => ({
            ...prev,
            [stateKey]: prev[stateKey] ? prev[stateKey].filter(item => item.id !== id) : []
          }));
        } catch (err) { 
          setModalConfig({ type: "alert", message: "Action failed" }); 
        }
      }
    });
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);
    try {
      const res = await apiRequest.put(`/admin/post/${editingPost.id}`, {
        ...inputs,
        isAvailable: inputs.isAvailable === "on"
      });
      setData(prev => ({
        ...prev,
        posts: prev.posts.map(p => p.id === editingPost.id ? res.data : p)
      }));
      setEditingPost(null); 
    } catch (err) { 
      setModalConfig({ type: "alert", message: "Failed to update post" });
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setData(prev => ({ ...prev, maintenance: prev.maintenance.map(m => m.id === id ? { ...m, status: newStatus } : m) }));
      await apiRequest.patch(`/admin/maintenance/${id}`, { status: newStatus });
    } catch (err) { 
      setModalConfig({ type: "alert", message: "Failed to update status." }); 
    }
  };

  const handleDismissReport = async (messageId) => {
    try {
      await apiRequest.put(`/messages/unflag/${messageId}`);
      setData(prev => ({ ...prev, reports: prev.reports.filter(r => r.id !== messageId) }));
    } catch (err) { 
      setModalConfig({ type: "alert", message: "Failed to dismiss report." }); 
    }
  };

  
  const handleUnrestrict = (userId) => {
    setModalConfig({
      type: "confirm",
      message: "Are you sure you want to unban this user?",
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.put(`/users/unrestrict/${userId}`);
          setModalConfig({ type: "alert", message: "User has been unbanned!" });
          setData(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isRestricted: false } : u) }));
        } catch (err) { 
          setModalConfig({ type: "alert", message: "Failed to unban user." }); 
        }
      }
    });
  };

  
  const handleRestrictUser = (userId) => {
    setModalConfig({
      type: "confirm",
      message: "Are you sure you want to restrict this user?",
      onConfirm: async () => {
        closePopup();
        try {
          await apiRequest.put(`/users/restrict/${userId}`);
          setModalConfig({ type: "alert", message: "User has been restricted!" });
          setData(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isRestricted: true } : u) }));
        } catch (err) { 
          setModalConfig({ type: "alert", message: "Failed to restrict user." }); 
        }
      }
    });
  };

  if (loading) return <div className="loader">Loading Admin Panel...</div>;

  return (
    <div className="adminDashboard">
      
      
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

      <div className="header">
        <h1>Admin Control Center</h1>
        <div className="headerActions">
          <input type="text" placeholder="Search..." onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="statsContainer">
        <div className="statCard">
          <h3>Total Accounts</h3>
          <p className="number">{totalUsers}</p>
          <span className="subtitle">Registered Users & Admins</span>
        </div>
        <div className="statCard">
          <h3>Occupancy Rate</h3>
          <div className="occupancyInfo">
            <div className="chart"><div className="bar" style={{width: `${occupancyRate}%`}}></div></div>
            <p className="number">{occupancyRate}%</p>
          </div>
          <span className="subtitle">{rentedPosts} Rented</span>
        </div>
        <div className="statCard">
          <h3>Active Issues</h3>
          <div style={{display:'flex', gap:'15px'}}>
             <div><p className="number warning">{activeMaintenance}</p><span className="subtitle">Maintenance</span></div>
             <div><p className="number error">{activeReports}</p><span className="subtitle">Reports</span></div>
          </div>
        </div>
      </div>

      {editingPost && (
        <div className="editModalOverlay">
          <div className="editModal">
            <h2>Edit Property</h2>
            <form onSubmit={handleUpdatePost}>
              <label>Title</label>
              <input name="title" defaultValue={editingPost.title} required />
              <label>Price ($)</label>
              <input name="price" type="number" defaultValue={editingPost.price} required />
              <div className="checkboxContainer">
                <label><input name="isAvailable" type="checkbox" defaultChecked={editingPost.isAvailable} /> Available?</label>
              </div>
              <div className="modalActions">
                <button type="submit" className="saveBtn">Save</button>
                <button type="button" className="cancelBtn" onClick={() => setEditingPost(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={activeTab === "admins" ? "active" : ""} onClick={() => setActiveTab("admins")}>Admins</button>
        <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>Users</button>
        <button className={activeTab === "posts" ? "active" : ""} onClick={() => setActiveTab("posts")}>Properties</button>
        <button className={activeTab === "feedbacks" ? "active" : ""} onClick={() => setActiveTab("feedbacks")}>Feedback</button>
        <button className={activeTab === "maintenance" ? "active" : ""} onClick={() => setActiveTab("maintenance")}>Maintenance</button>
        <button className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")} style={{color: '#dc2626'}}>Reports ({activeReports})</button>
      </div>

      <div className="tableContainer">
        <table className="dataTable">
          <thead>
            {(activeTab === "users") && (
              <tr><th>Username</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            )}
            {activeTab === "admins" && (
               <tr><th>Username</th><th>Email</th><th>Role</th></tr>
            )}
            {activeTab === "posts" && <tr><th>Title</th><th>Price</th><th>Status</th><th>Actions</th></tr>}
            {activeTab === "feedbacks" && <tr><th>From</th><th>Message</th><th>Date</th><th>Actions</th></tr>}
            {activeTab === "maintenance" && <tr><th>Property</th><th>Issue</th><th>Status</th><th>Date</th><th>Actions</th></tr>}
            {activeTab === "reports" && <tr><th>Sender</th><th>Abusive Content</th><th>Date</th><th>Actions</th></tr>}
          </thead>
          <tbody>
            
            {activeTab === "admins" && 
              data.users.filter(u => u.isAdmin && u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td><span className="badge admin" style={{background: '#7e22ce', color: 'white'}}>Super Admin</span></td>
                  </tr>
              ))
            }

            {activeTab === "users" && 
              data.users.filter(u => !u.isAdmin && u.username.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.isRestricted ? <span className="badge rented">Restricted</span> : <span className="badge user">User</span>}</td>
                    <td className="actionsCell">
                      {user.isRestricted ? (
                        <button className="roleBtn" style={{backgroundColor: '#dcfce7', color: '#166534', marginRight: '8px'}} onClick={() => handleUnrestrict(user.id)}>Unban</button>
                      ) : (
                        <button className="roleBtn demote" style={{backgroundColor: '#fee2e2', color: '#b91c1c', marginRight: '8px'}} onClick={() => handleRestrictUser(user.id)}>Restrict</button>
                      )}
                      <button onClick={() => handleDelete("user", user.id)} className="deleteBtn">Delete</button>
                    </td>
                  </tr>
              ))
            }
            
            {activeTab === "posts" && 
              data.posts.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase())).map(post => (
                  <tr key={post.id}>
                    <td>{post.title}</td>
                    <td>${post.price}</td>
                    <td><span className={`badge ${post.isAvailable ? "available" : "rented"}`}>{post.isAvailable ? "Available" : "Rented"}</span></td>
                    <td className="actionsCell">
                      <button className="editBtn" onClick={() => setEditingPost(post)}>Edit</button>
                      
                    </td>
                  </tr>
              ))
            }

            {activeTab === "feedbacks" && 
              data.feedbacks?.filter(f => f.message.toLowerCase().includes(searchTerm.toLowerCase())).map(fb => (
                  <tr key={fb.id}>
                    <td><div className="userCell"><span className="name">{fb.name}</span><span className="email">{fb.email}</span></div></td>
                    <td className="messageCell"><p>{fb.message}</p></td>
                    <td className="dateCell">{new Date(fb.createdAt).toLocaleDateString()}</td>
                    <td className="actionsCell"><button onClick={() => handleDelete("feedback", fb.id)} className="deleteBtn">Delete</button></td>
                  </tr>
              ))
            }

            {activeTab === "maintenance" && 
              data.maintenance?.filter(m => m.post.title.toLowerCase().includes(searchTerm.toLowerCase())).map(req => (
                  <tr key={req.id}>
                    <td><div className="userCell"><span className="name">{req.post.title}</span><span className="email">Tenant: {req.tenant.username}</span></div></td>
                    <td className="messageCell"><p>{req.description}</p></td>
                    <td>
                      <select className={`statusSelect ${req.status}`} value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="dateCell">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="actionsCell"><button onClick={() => handleDelete("maintenance", req.id)} className="deleteBtn">Delete</button></td>
                  </tr>
              ))
            }

            {activeTab === "reports" && 
              data.reports?.map(report => (
                <tr key={report.id}>
                  <td><div className="userCell"><span className="name">{report.sender.username}</span></div></td>
                  <td className="messageCell"><span style={{color: '#dc2626', fontWeight: 'bold'}}>"{report.text}"</span></td>
                  <td className="dateCell">{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td className="actionsCell">
                    {!report.sender.isRestricted && (
                      <button className="roleBtn demote" style={{backgroundColor: '#fee2e2', color: '#b91c1c', marginRight: '10px'}} onClick={() => handleRestrictUser(report.userId)}>Restrict</button>
                    )}
                    <button className="editBtn" style={{backgroundColor: '#dcfce7', color: '#166534'}} onClick={() => handleDismissReport(report.id)}>Mark Safe</button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;