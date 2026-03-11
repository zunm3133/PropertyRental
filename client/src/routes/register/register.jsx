import "./register.scss";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import apiRequest from "../../lib/apiRequest";

function Register() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const formData = new FormData(e.target);

    const username = formData.get("username");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      await apiRequest.post("/auth/register", {
        username,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registerPage">
      <div className="formContainer">
        <form onSubmit={handleSubmit}>
          <h1>Create an Account</h1>
          <p className="subtitle">Join thousands of users finding their dream home.</p>
          
          <input name="username" type="text" placeholder="Username" required />
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="password" type="password" placeholder="Password" required />
          
          <button disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Register"}
          </button>
          
          {error && <span className="error-msg">{error}</span>}
          
          <div className="footer-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
      <div className="imgContainer">
        <img src="/bg.png" alt="Modern Building" />
      </div>
    </div>
  );
}

export default Register;