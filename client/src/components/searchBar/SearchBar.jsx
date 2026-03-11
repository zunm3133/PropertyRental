import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import apiRequest from "../../lib/apiRequest";
import "./searchBar.scss";

function SearchBar() {
  const [query, setQuery] = useState({
    type: "rent",
    city: "",
    minPrice: "",
    maxPrice: "",
  });

  const [dbCities, setDbCities] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await apiRequest.get("/posts/cities");
        setDbCities(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCities();
  }, []);

  const handleCityChange = (e) => {
    const val = e.target.value;
    setQuery((prev) => ({ ...prev, city: val }));
    if (val.length > 0) {
      const filtered = dbCities.filter((city) =>
        city.toLowerCase().startsWith(val.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions(dbCities);
    }
  };

  const handleFocus = () => {
    setShowDropdown(true);
    if (query.city === "") setSuggestions(dbCities);
  };

  const handleSelectCity = (city) => {
    setQuery((prev) => ({ ...prev, city: city }));
    setShowDropdown(false);
  };

  const handlePriceChange = (e) => {
    setQuery((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="searchBarContainer">
      <div className="tabs">
        <span className="tab active">Rent</span>
      </div>

      <form className="search-inputs">
        
       
        <div className="top-inputs">
         
          <div className="input-box city-box">
            <svg 
              className="icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="City Location"
              onChange={handleCityChange}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              value={query.city}
            />
            {showDropdown && suggestions.length > 0 && (
              <div className="dropdown-menu">
                <ul>
                  {suggestions.map((city, index) => (
                    <li key={index} onClick={() => handleSelectCity(city)}>
                      <img src="/pin.png" alt="" /> {city}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          
          <div className="input-box price-box">
            <input
              type="number"
              name="minPrice"
              placeholder="Min Price ($)"
              onChange={handlePriceChange}
              value={query.minPrice}
            />
          </div>

          
          <div className="input-box price-box">
            <input
              type="number"
              name="maxPrice"
              placeholder="Max Price ($)"
              onChange={handlePriceChange}
              value={query.maxPrice}
            />
          </div>
        </div>

        
        <Link
          to={`/list?type=rent&city=${query.city}&minPrice=${query.minPrice}&maxPrice=${query.maxPrice}`}
        >
          <button className="search-btn">
            <span>Search</span>
          </button>
        </Link>
      </form>
    </div>
  );
}

export default SearchBar;