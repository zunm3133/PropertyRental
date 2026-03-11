import { useState } from "react";
import "./newPostPage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate } from "react-router-dom";

function NewPostPage() {
  const [value, setValue] = useState("");
  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); 

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    
    const lat = parseFloat(inputs.latitude);
    const lng = parseFloat(inputs.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError("Invalid Latitude! Must be between -90 and 90.");
      setLoading(false);
      return;
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError("Invalid Longitude! Must be between -180 and 180.");
      setLoading(false);
      return;
    }
    

    try {
      const res = await apiRequest.post("/posts", {
        title: inputs.title,
        price: parseInt(inputs.price),
        address: inputs.address,
        city: inputs.city,
        bedroom: parseInt(inputs.bedroom),
        bathroom: parseInt(inputs.bathroom),
        type: inputs.type,
        property: inputs.property,
        latitude: inputs.latitude,
        longitude: inputs.longitude,
        images: images,
        desc: value,
        utilities: inputs.utilities,
        pet: inputs.pet,
        income: inputs.income,
        size: parseInt(inputs.size),
        school: parseInt(inputs.school),
        bus: parseInt(inputs.bus),
        restaurant: parseInt(inputs.restaurant),
      });
      
      navigate("/" + res.data.id);
    } catch (err) {
      console.log(err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="newPostPage">
      <div className="formContainer">
        <div className="header">
          <h1>Add New Property</h1>
          <p>Fill in the details below to list your property.</p>
        </div>
        
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" placeholder="e.g. Modern Apartment in City Center" required />
            </div>
            <div className="item">
              <label htmlFor="price">Price ($)</label>
              <input id="price" name="price" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" required />
            </div>
            
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} className="editor" />
            </div>

            <div className="item">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" required />
            </div>
            
            <div className="item">
              <label htmlFor="bedroom">Bedroom</label>
              <input min={1} id="bedroom" name="bedroom" type="number" required />
            </div>
            <div className="item">
              <label htmlFor="bathroom">Bathroom</label>
              <input min={1} id="bathroom" name="bathroom" type="number" required />
            </div>
            
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="number" step="any" placeholder="e.g. 51.5074" required />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="number" step="any" placeholder="e.g. -0.1278" required />
            </div>
            
            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type">
                <option value="rent" defaultChecked>Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Property Type</label>
              <select name="property">
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities">
                <option value="owner">Owner is responsible</option>
                <option value="tenant">Tenant is responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet">
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not Allowed</option>
              </select>
            </div>
            
            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input id="income" name="income" type="text" placeholder="e.g. 3x Rent" />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input min={0} id="size" name="size" type="number" />
            </div>
            
            <div className="item">
              <label htmlFor="school">Nearby School (m)</label>
              <input min={0} id="school" name="school" type="number" />
            </div>
            <div className="item">
              <label htmlFor="bus">Nearby Bus (m)</label>
              <input min={0} id="bus" name="bus" type="number" />
            </div>
            <div className="item">
              <label htmlFor="restaurant">Nearby Restaurant (m)</label>
              <input min={0} id="restaurant" name="restaurant" type="number" />
            </div>

            <button className="sendButton" disabled={loading}>
              {loading ? "Adding..." : "Add Property"}
            </button>
            {error && <span className="error" style={{color: "red", fontWeight: "bold", marginTop: "10px", display: "block"}}>{error}</span>}
          </form>
        </div>
      </div>
      
      <div className="sideContainer">
        <h3>Property Images</h3>
        <div className="image-grid">
          {images.map((image, index) => (
            <img src={image} key={index} alt="Property" />
          ))}
        </div>
        
        <UploadWidget
          uwConfig={{
            multiple: true,
            cloudName: "dkmd2kobp",
            uploadPreset: "property_rental",
            folder: "posts",
          }}
          setState={setImages}
        />
      </div>
    </div>
  );
}

export default NewPostPage;