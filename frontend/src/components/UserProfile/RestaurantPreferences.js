import React from 'react';
import '../../styles/UserProfile.css';

const restaurants = [
  { name: 'McDonald\'s', file: 'mcdonalds.png' },
  { name: 'Starbucks', file: 'starbucks.png' },
  { name: 'Del Taco', file: 'deltaco.png' },
  { name: 'Church\'s', file: 'church.png' },
];

const addRes = [
  { name: 'Add Resturant', file: 'add_pref_icon.png' },
];

const RestaurantPreferences = () => {
  return (
    <div className="inline-section">
        <h4>Do not recommend these restaurants</h4>
    <div className="white-box">
          <div className="pill-container">
            {restaurants.map((item) => (
              <div className="pill-icon" key={item.name}>
                <img src={`/${item.file}`} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}
            {addRes.map((item) => (
                <div className="pill-icon" key={item.name}>
                    <img src={`/${item.file}`} alt={item.name} />
                    <span>{item.name}</span>
                </div>
                ))}
          </div>
        </div>
    </div>

  );
};

export default RestaurantPreferences;
