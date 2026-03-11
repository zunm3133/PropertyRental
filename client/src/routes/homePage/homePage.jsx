import { useContext, useState } from "react";
import SearchBar from "../../components/searchBar/SearchBar";
import "./homePage.scss";
import { AuthContext } from "../../context/AuthContext";
import apiRequest from "../../lib/apiRequest";
import { Link } from "react-router-dom"; 
import { Reveal } from "../../components/animation/Reveal"; 

function HomePage() {
  const { currentUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest.post("/feedback", formData);
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.log(err);
      setStatus("error");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="homePage">
     
      
      <section className="hero">
        <div className="container">
          <div className="textWrapper">
            
            <Reveal width="100%">
              <h1 className="title">The Future of Property Is Here</h1>
              <p className="description">
                Find your dream home or manage your rentals with the most trusted real estate platform.
              </p>
              <SearchBar />
              <div className="stats-preview">
                <div className="stat">
                   <h2>1200+</h2>
                   <span>Premium Listings</span>
                </div>
                <div className="stat">
                   <h2>4500+</h2>
                   <span>Happy Customers</span>
                </div>
                <div className="stat">
                   <h2>100+</h2>
                   <span>Awards Won</span>
                </div>
              </div>
            </Reveal>
          </div>
          <div className="imgWrapper">
            <Reveal delay={0.4}>
               <img src="/bg.png" alt="Hero Background" />
            </Reveal>
          </div>
        </div>
      </section>

      
      
      <section className="features">
        <div className="container">
          <Reveal width="100%">
             <h2 className="section-title">Why Choose PRMS?</h2>
             <p className="section-subtitle">We provide the most complete and secure real estate ecosystem.</p>
          </Reveal>
          
          <div className="feature-grid">
            <Reveal delay={0.2}>
              <div className="feature-card">
                <div className="icon">🏠</div>
                <h3>Quality Homes</h3>
                <p>Explore verified listings with detailed visual tours.</p>
              </div>
            </Reveal>
            <Reveal delay={0.3}>
              <div className="feature-card">
                <div className="icon">🛡️</div>
                <h3>Secure Payment Tracking</h3>
                <p>Track all your rental payments securely.</p>
              </div>
            </Reveal>
            <Reveal delay={0.4}>
              <div className="feature-card">
                <div className="icon">⚡</div>
                <h3>Fast Process</h3>
                <p>From search to signing, everything is digital.</p>
              </div>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="feature-card">
                <div className="icon">🤝</div>
                <h3>Direct Contact</h3>
                <p>Connect directly with owners, no middleman.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      
      
      <section className="platforms" id="about">
        <div className="container">
          <Reveal width="100%">
            <h2 className="section-title">Our Platforms</h2>
          </Reveal>
          
         
          <div className="split-row">
            <div className="image-side">
               <Reveal>
                 <img src="/house1.png" alt="Interior" /> 
               </Reveal>
            </div>
            <div className="text-side">
               <Reveal width="100%" delay={0.2}>
                 <h3>Our Properties</h3>
                 <p>We verify every property to ensure it meets our high standards of living. Enjoy peace of mind with our curated selection.</p>
                 <ul>
                   <li>Verified Landlords</li>
                   <li>Virtual Tours</li>
                   <li>Instant Booking</li>
                 </ul>
                 <Link to="/list">
                   <button className="btn-primary">Browse Listings</button>
                 </Link>
               </Reveal>
            </div>
          </div>

         
          <div className="split-row">
            <div className="text-side">
               <Reveal width="100%" delay={0.2}>
                 <h3>Sell & Rent Smart</h3>
                 <p>Manage your properties with our advanced dashboard. Track payments, handle maintenance, and sign leases online.</p>
                 <ul>
                   <li>Payment Tracking</li>
                   <li>Digital Contracts</li>
                   <li>Maintenance Requests</li>
                 </ul>
                 <Link to="/add">
                   <button className="btn-primary">List Your Property</button>
                 </Link>
               </Reveal>
            </div>
            <div className="image-side">
               <Reveal delay={0.4}>
                 <img src="/house2.jpg" alt="Keys" />
               </Reveal>
            </div>
          </div>
        </div>
      </section>

      
      
      <section className="stats-banner">
        <div className="container">
           <div className="stat-box">
             <Reveal width="100%">
               <h1>25,500+</h1>
               <span>Happy Customers</span>
             </Reveal>
           </div>
           <div className="stat-box">
             <Reveal width="100%" delay={0.2}>
               <h1>$4.2Bn+</h1>
               <span>Property Value</span>
             </Reveal>
           </div>
           <div className="stat-box">
             <Reveal width="100%" delay={0.4}>
               <h1>150k+</h1>
               <span>Monthly Traffic</span>
             </Reveal>
           </div>
        </div>
      </section>

      
      
      <section className="testimonials">
         <div className="container">
           <Reveal width="100%">
             <h2 className="section-title">What Our Customers Say</h2>
           </Reveal>
           
           <div className="review-grid">
             <Reveal delay={0.2}>
               <div className="review-card">
                 <div className="stars">⭐⭐⭐⭐⭐</div>
                 <p>"The best platform for finding a rental. The process was seamless and the payment tracker is a lifesaver!"</p>
                 <div className="user">
                   <img src="/noavatar.jpg" alt="User" />
                   <span>Carlos</span>
                 </div>
               </div>
             </Reveal>
             <Reveal delay={0.3}>
               <div className="review-card">
                 <div className="stars">⭐⭐⭐⭐⭐</div>
                 <p>"As a landlord, this tool changed how I manage my units. The maintenance request feature is fantastic."</p>
                 <div className="user">
                   <img src="/noavatar.jpg" alt="User" />
                   <span>Mary</span>
                 </div>
               </div>
             </Reveal>
             <Reveal delay={0.4}>
               <div className="review-card">
                 <div className="stars">⭐⭐⭐⭐⭐</div>
                 <p>"Highly recommended! The digital lease signing saved me so much time. Great support team too."</p>
                 <div className="user">
                   <img src="/noavatar.jpg" alt="User" />
                   <span>Zun</span>
                 </div>
               </div>
             </Reveal>
           </div>
         </div>
      </section>
      
      
      
      <section className="feedback-section" id="feedback" style={{ padding: "80px 0", background: "#f8fafc" }}>
        <div className="container" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <Reveal width="100%">
            <h2 className="section-title">We Value Your Feedback</h2>
            <p className="section-subtitle">Help us improve your experience.</p>
          </Reveal>
          
          {status === "success" ? (
             <div style={{ padding: "20px", background: "#dcfce7", color: "#166534", borderRadius: "8px" }}>
               Thank you! Your feedback has been sent.
             </div>
          ) : (
            <Reveal width="100%" delay={0.2}>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
                <input 
                  type="text" 
                  name="name"
                  placeholder="Your Name" 
                  required 
                  value={formData.name}
                  onChange={handleChange}
                  style={{ padding: "15px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input 
                  type="email" 
                  name="email"
                  placeholder="Your Email" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  style={{ padding: "15px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <textarea 
                  name="message"
                  placeholder="Your Message or Suggestion" 
                  rows={5} 
                  required 
                  value={formData.message}
                  onChange={handleChange}
                  style={{ padding: "15px", borderRadius: "5px", border: "1px solid #ccc", resize: "none" }}
                />
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ marginTop: "10px", width: "100%" }}
                >
                  Submit Feedback
                </button>
                {status === "error" && <span style={{color:"red"}}>Something went wrong. Please try again.</span>}
              </form>
            </Reveal>
          )}
        </div>
      </section>

      
      
      <section className="cta-banner">
        <div className="container">
           <div className="cta-content">
             <Reveal width="100%">
               <h2>Ready to Find Your Perfect Property?</h2>
               <p>Join thousands of users today and experience the future of real estate.</p>
               <div className="buttons">
                  <Link to="/list">
                    <button className="btn-white">Get Started</button>
                  </Link>
                  <button className="btn-outline">Contact Us</button>
               </div>
             </Reveal>
           </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;