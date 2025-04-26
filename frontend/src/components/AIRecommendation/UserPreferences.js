// components/AIRecommendation/UserPreferences.js
import React from 'react';

export default function UserPreferences() {
  const dietaryRestrictions = [
    { name: 'Avocado', file: 'avacado_allergy.png' },
    { name: 'Peanut', file: 'nut_allergy.png' },
    { name: 'Mushroom', file: 'mushroom_allergy.png' },
  ];

  const foodPreferences = [
    { name: 'Egg', file: 'egg_allergy.png' },
    { name: 'Fish', file: 'fish_allergy.png'}
  ];

  const addPref = [
    { name: 'Add Preference', file: 'add_pref_icon.png' },
  ];

  return (
    <div className="user-preferences">
      <div className="preferences-card">
        <h3>Dietary Restrictions</h3>
        <div className="preference-icons">
        {dietaryRestrictions.map((item, i) => (
            <div className="pill-icon" key={i}>
                <img src={`/${item.file}`} alt={item.name} />
                <span>{item.name}</span>
            </div>
            ))}

          {addPref.map((item) => (
                <div className="pill-icon" key={item.name}>
                    <img src={`/${item.file}`} alt={item.name} />
                    <span>{item.name}</span>
                </div>
                ))}
        </div>
      </div>

      <div className="preferences-card">
        <h3>Food Preferences</h3>
        <div className="preference-icons">
        {foodPreferences.map((item, i) => (
            <div className="pill-icon" key={i}>
                <img src={`/${item.file}`} alt={item.name} />
                <span>{item.name}</span>
            </div>
            ))}

          {addPref.map((item) => (
                <div className="pill-icon" key={item.name}>
                    <img src={`/${item.file}`} alt={item.name} />
                    <span>{item.name}</span>
                </div>
                ))}
        </div>
      </div>
    </div>
  );
}
