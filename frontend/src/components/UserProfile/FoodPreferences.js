import React from 'react';
import '../../styles/UserProfile.css';

const ingredients = [
  { name: 'Fish', file: 'fish_allergy.png' },
  { name: 'Carrot', file: 'carrot_allergy.png' },
  { name: 'Egg', file: 'egg_allergy.png' },
  { name: 'Cheese', file: 'cheese_allergy.png' },
];

const addIng = [
  { name: 'Add Ingridient', file: 'add_pref_icon.png' },
];
const FoodPreferences = () => {
  return (
    <div className="inline-section">
        <h4>Do not recommend these ingredients</h4>
    <div className="white-cont">
          <div className="dietary-pill-container">
            {ingredients.map((item) => (
              <div className="dietary-pill-icon" key={item.name}>
                <img src={`/${item.file}`} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}

            {addIng.map((item) => (
                <div className="dietary-pill-icon" key={item.name}>
                    <img src={`/${item.file}`} alt={item.name} />
                    <span>{item.name}</span>
                </div>
                ))}
          </div>
        </div>
      </div>
  );
};

export default FoodPreferences;
