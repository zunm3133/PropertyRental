import { useContext, useState } from "react";
import "./profileUpdatePage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { useNavigate } from "react-router-dom";
import UploadWidget from "../../components/uploadWidget/UploadWidget";

function ProfileUpdatePage() {
  const { currentUser, updateUser } = useContext(AuthContext);
  const [error, setError] = useState("");
  const [avatar, setAvatar] = useState([]);
  const [isLoading, setIsLoading] = useState(false); 

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.target);

    const { username, email, password } = Object.fromEntries(formData);

    try {
      const res = await apiRequest.put(`/users/${currentUser.id}`, {
        username,
        email,
        password,
        avatar: avatar[0],
      });
      updateUser(res.data);
      navigate("/profile");
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profileUpdatePage">
      
      <div className="formContainer">
        <div className="header">
          <h1>Edit Profile</h1>
          <p>Update your personal details below.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="item">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              defaultValue={currentUser.username}
              required
            />
          </div>
          <div className="item">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={currentUser.email}
              required
            />
          </div>
          <div className="item">
            <label htmlFor="password">New Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="(Leave blank to keep current)"
            />
          </div>
          
          <button disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Changes"}
          </button>
          
          {error && <span className="error">{error}</span>}
        </form>
      </div>

      
      <div className="sideContainer">
        <div className="avatar-card">
          <img 
            src={avatar[0] || currentUser.avatar || "/noavatar.jpg"} 
            alt="Avatar" 
            className="avatar" 
          />
          <div className="upload-section">
            <p>Profile Picture</p>
            <UploadWidget
              uwConfig={{
                cloudName: "dkmd2kobp",
                uploadPreset: "property_rental",
                multiple: false,
                maxImageFileSize: 2000000,
                folder: "avatars",
              }}
              setState={setAvatar}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileUpdatePage;