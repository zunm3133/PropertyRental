import { useState } from "react";
import apiRequest from "../../lib/apiRequest";
import { Link } from "react-router-dom";
import "./forgotPassword.scss"; 

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest.post("/auth/forgot-password", { email });
      setMessage("Check your email for the reset link!");
      setError(null);
    } catch (err) {
      setError(err.response.data.message);
      setMessage(null);
    }
  };

  return (
    <div className="forgotPasswordPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Reset Password</h1>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button>Send Reset Link</button>
          {message && <span className="success">{message}</span>}
          {error && <span className="error">{error}</span>}
          <Link to="/login">Back to Login</Link>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;