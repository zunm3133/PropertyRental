import "./aboutPage.scss";
import { Reveal } from "../../components/animation/Reveal"; 
function AboutPage() {
  return (
    <div className="aboutPage">
      
      
      <div className="headerContainer">
        <Reveal width="100%">
          <h1 className="title">About <span className="highlight">PRMS</span></h1>
          <p className="subtitle">
            Revolutionizing property management with security, transparency, and ease.
          </p>
        </Reveal>
      </div>

      <div className="contentWrapper">
        
       
        <div className="textSide">
          <Reveal delay={0.2}>
            <div className="sectionCard">
              <h2>What is PRMS?</h2>
              <p>
                The <b>Property Rental Management System (PRMS)</b> is a comprehensive web platform designed to bridge the gap between property owners and tenants. 
                In a market often cluttered with unverified listings and manual paperwork, PRMS offers a digital-first solution.
              </p>
              <p>
                We provide a secure environment where payments are tracked, maintenance requests are logged, and leases are signed digitally—all in one place.
              </p>
            </div>

            <div className="sectionCard">
              <h2>Our Core Values</h2>
              <div className="valuesGrid">
                <div className="valueItem">
                  <span className="icon">🛡️</span>
                  <h3>Security</h3>
                  <p>Verified users and secure logs.</p>
                </div>
                <div className="valueItem">
                  <span className="icon">⚡</span>
                  <h3>Efficiency</h3>
                  <p>Automated tracking and alerts.</p>
                </div>
                <div className="valueItem">
                  <span className="icon">🤝</span>
                  <h3>Transparency</h3>
                  <p>No hidden fees or middlemen.</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        
        <div className="infoSide">
          
          
          <Reveal delay={0.3}>
            <div className="hoursCard">
              <div className="cardHeader">
                <span className="cardIcon">🕒</span>
                <h3>Operating Hours</h3>
              </div>
              <p className="note">Our admin team reviews listings and approvals during these times:</p>
              
              <ul className="hoursList">
                <li>
                  <span>Monday - Friday</span>
                  <b>9:00 AM - 6:00 PM</b>
                </li>
                <li>
                  <span>Saturday</span>
                  <b>10:00 AM - 4:00 PM</b>
                </li>
                <li>
                  <span>Sunday</span>
                  <b className="closed">Closed</b>
                </li>
              </ul>
            </div>
          </Reveal>

          

        </div>
      </div>
    </div>
  );
}

export default AboutPage;