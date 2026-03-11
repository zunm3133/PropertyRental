import { useState } from "react";
import "./updatePage.scss";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import apiRequest from "../../lib/apiRequest";
import UploadWidget from "../../components/uploadWidget/UploadWidget";
import { useNavigate, useLoaderData } from "react-router-dom";

function UpdatePage() {
  const post = useLoaderData();
  
  
  const [value, setValue] = useState(post?.desc || ""); 
  const [images, setImages] = useState(post?.images || []);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const navigate = useNavigate();

  if (!post) return <div className="updatePage">Error: Property data not found.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.target);
    const inputs = Object.fromEntries(formData);

    try {
      await apiRequest.put(`/posts/${post.id}`, {
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
      navigate("/" + post.id);
    } catch (err) {
      console.log(err);
      setError(err.response?.data?.message || "Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="updatePage">
      <div className="formContainer">
        <div className="header">
          <h1>Update Property</h1>
          <p>Edit the details of your listing below.</p>
        </div>
        
        <div className="wrapper">
          <form onSubmit={handleSubmit}>
            <div className="item">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" defaultValue={post.title} required />
            </div>
            <div className="item">
              <label htmlFor="price">Price ($)</label>
              <input id="price" name="price" type="number" defaultValue={post.price} required />
            </div>
            <div className="item">
              <label htmlFor="address">Address</label>
              <input id="address" name="address" type="text" defaultValue={post.address} required />
            </div>
            
            <div className="item description">
              <label htmlFor="desc">Description</label>
              <ReactQuill theme="snow" onChange={setValue} value={value} className="editor" />
            </div>
            
            <div className="item">
              <label htmlFor="city">City</label>
              <input id="city" name="city" type="text" defaultValue={post.city} required />
            </div>
            <div className="item">
              <label htmlFor="bedroom">Bedroom</label>
              <input min={1} id="bedroom" name="bedroom" type="number" defaultValue={post.bedroom} required />
            </div>
            <div className="item">
              <label htmlFor="bathroom">Bathroom</label>
              <input min={1} id="bathroom" name="bathroom" type="number" defaultValue={post.bathroom} required />
            </div>
            <div className="item">
              <label htmlFor="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="text" defaultValue={post.latitude} required />
            </div>
            <div className="item">
              <label htmlFor="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="text" defaultValue={post.longitude} required />
            </div>
            <div className="item">
              <label htmlFor="type">Type</label>
              <select name="type" defaultValue={post.type}>
                <option value="rent">Rent</option>
                <option value="buy">Buy</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="property">Property Type</label>
              <select name="property" defaultValue={post.property}>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="item">
              <label htmlFor="utilities">Utilities Policy</label>
              <select name="utilities" defaultValue={post?.utilities}>
                <option value="owner">Owner is responsible</option>
                <option value="tenant">Tenant is responsible</option>
                <option value="shared">Shared</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="pet">Pet Policy</label>
              <select name="pet" defaultValue={post?.pet}>
                <option value="allowed">Allowed</option>
                <option value="not-allowed">Not Allowed</option>
              </select>
            </div>
            <div className="item">
              <label htmlFor="income">Income Policy</label>
              <input id="income" name="income" type="text" defaultValue={post?.income || ""} />
            </div>
            <div className="item">
              <label htmlFor="size">Total Size (sqft)</label>
              <input min={0} id="size" name="size" type="number" defaultValue={post?.size || 0} />
            </div>
            <div className="item">
              <label htmlFor="school">Nearby School (m)</label>
              <input min={0} id="school" name="school" type="number" defaultValue={post?.school || 0} />
            </div>
            <div className="item">
              <label htmlFor="bus">Nearby Bus (m)</label>
              <input min={0} id="bus" name="bus" type="number" defaultValue={post?.bus || 0} />
            </div>
            <div className="item">
              <label htmlFor="restaurant">Nearby Restaurant (m)</label>
              <input min={0} id="restaurant" name="restaurant" type="number" defaultValue={post?.restaurant || 0} />
            </div>
            
            <button className="sendButton" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Property"}
            </button>
            {error && <span className="error">{error}</span>}
          </form>
        </div>
      </div>
      
      <div className="sideContainer">
        <h3>Property Images</h3>
        <div className="images">
          {images.map((image, index) => (
            <img src={image} key={index} alt="" />
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

export default UpdatePage;