import { useEffect, useState, useRef } from "react";

function UploadWidget({ uwConfig, setState }) {
  const [loaded, setLoaded] = useState(false);
  const widgetRef = useRef(null); 

  useEffect(() => {
   
    const uwScript = document.getElementById("uw");

    if (!uwScript) {
      
      const script = document.createElement("script");
      script.setAttribute("async", "");
      script.setAttribute("id", "uw");
      script.src = "https://upload-widget.cloudinary.com/global/all.js";
      script.onload = () => setLoaded(true); 
      document.body.appendChild(script);
    } else {
      
      if (window.cloudinary) {
        setLoaded(true);
      } else {
        uwScript.onload = () => setLoaded(true);
      }
    }
  }, []);

  useEffect(() => {
   
    if (loaded) {
      if (!window.cloudinary) {
        console.error("Cloudinary script not found");
        return;
      }

      if (!widgetRef.current) {
        widgetRef.current = window.cloudinary.createUploadWidget(
          uwConfig,
          (error, result) => {
            if (!error && result && result.event === "success") {
              console.log("Upload success:", result.info.secure_url);
              setState((prev) => [...prev, result.info.secure_url]);
            }
          }
        );
      }
    }
  }, [loaded, uwConfig, setState]);

  
  const handleOpenWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      console.log("Widget not loaded yet, please wait...");
    }
  };

  return (
   
    <button
      id="upload_widget"
      className="btn primary-btn"  
      onClick={handleOpenWidget}
    >
      Upload
    </button>
  );
}

export default UploadWidget;