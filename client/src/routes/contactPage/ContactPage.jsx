import { useState } from "react";
import "./contactPage.scss";
import { Reveal } from "../../components/animation/Reveal";
import apiRequest from "../../lib/apiRequest"; 

function ContactPage() {
  const [activeAccordion, setActiveAccordion] = useState(null);

  
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
  

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const faqs = [
    {
      question: "Is there a fee for listing a property?",
      answer: "Listing your first property is free!"
    },
    {
      question: "How are maintenance requests handled?",
      answer: "Tenants can submit requests directly through the app. Landlords receive an instant notification and can update the status (Pending, In Progress, Completed) from their dashboard."
    },
    {
      question: "Why I cannot chat?",
      answer: "If you're unable to chat, it's likely because the other user is not online or has been restricted due to inappropraite language detection."
    }
  ];

  return (
    <div className="contactPage">
      
      
      <div className="headerContainer">
        <Reveal width="100%">
          <h1 className="title">Get in Touch</h1>
          <p className="subtitle">Have questions about PRMS? We are here to help.</p>
        </Reveal>
      </div>

      <div className="contentWrapper">
       
        <div className="infoSide">
          <Reveal delay={0.2}>
            <div className="contactCard">
              <h3>Contact Information</h3>
              <div className="item">
                <span className="icon">📍</span>
                <span>Orchard Road, Singapore</span>
              </div>
              <div className="item">
                <span className="icon">📞</span>
                <span>+61 88226678</span>
              </div>
              <div className="item">
                <span className="icon">✉️</span>
                <span>support@prms.com</span>
              </div>
            </div>

            <div className="hoursCard">
              <h3>🕒 Operating Hours</h3>
              <p className="note">Our support team is available during these times:</p>
              <ul>
                <li><span>Mon - Fri</span><b>9:00 AM - 6:00 PM</b></li>
                <li><span>Sat</span><b>10:00 AM - 4:00 PM</b></li>
                <li><span>Sun</span><b className="closed">Closed</b></li>
              </ul>
            </div>
          </Reveal>
        </div>

        
        <div className="formSide">
          
         
          <Reveal delay={0.3} width="100%">
            <div className="faqSection">
              <h2>Frequently Asked Questions</h2>
              <div className="accordion">
                {faqs.map((item, index) => (
                  <div 
                    key={index} 
                    className={`faqItem ${activeAccordion === index ? "active" : ""}`}
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className="faqHeader">
                      <span>{item.question}</span>
                      <span className="arrow">▼</span>
                    </div>
                    <div className="faqBody">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

         
          <Reveal delay={0.4} width="100%">
            <div className="formSection">
              
              <h2>We Value Your Feedback</h2>
              <p style={{ color: "#64748b", marginBottom: "20px" }}>
                Help us improve your experience.
              </p>
              
              {status === "success" ? (
                <div style={{ padding: "20px", background: "#dcfce7", color: "#166534", borderRadius: "8px" }}>
                  Thank you! Your feedback has been sent.
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px", textAlign: "left" }}>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Your Name" 
                    required 
                    value={formData.name}
                    onChange={handleChange}
                    style={{ padding: "15px", borderRadius: "5px", border: "1px solid #e2e8f0" }}
                  />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Your Email" 
                    required 
                    value={formData.email}
                    onChange={handleChange}
                    style={{ padding: "15px", borderRadius: "5px", border: "1px solid #e2e8f0" }}
                  />
                  <textarea 
                    name="message"
                    placeholder="Your Message or Suggestion" 
                    rows={5} 
                    required 
                    value={formData.message}
                    onChange={handleChange}
                    style={{ padding: "15px", borderRadius: "5px", border: "1px solid #e2e8f0", resize: "none", fontFamily: "inherit" }}
                  />
                  <button 
                    type="submit" 
                    className="submitBtn" 
                    style={{ marginTop: "10px", width: "100%" }}
                  >
                    Submit Feedback
                  </button>
                  {status === "error" && <span style={{color:"red"}}>Something went wrong. Please try again.</span>}
                </form>
              )}
            </div>
          </Reveal>

        </div>
      </div>
    </div>
  );
}

export default ContactPage;