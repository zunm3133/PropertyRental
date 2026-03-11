import { useEffect, useState } from "react";
import "./scrollToTop.scss";

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className={`scrollToTop ${isVisible ? "visible" : ""}`} onClick={scrollToTop}>
      
      ⬆
    </div>
  );
}

export default ScrollToTop;