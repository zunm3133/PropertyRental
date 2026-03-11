import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import "./resetPassword.scss";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest.post("/auth/reset-password", {
        userId: id,
        token,
        newPassword: password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response.data.message);
    }
  };

  return (
    <div className="resetPasswordPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Set New Password</h1>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button>Update Password</button>
          {error && <span className="error">{error}</span>}
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;