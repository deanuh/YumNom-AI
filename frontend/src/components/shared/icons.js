// components/shared/icons.js
// Central place for icons + helpers

export const ICONS = {
    // common allergies
    avocado: "avacado_allergy.png",
    mushroom: "mushroom_allergy.png",
    egg: "egg_allergy.png",
  
    peanut: "nut_allergy.png",
    soy: "nut_allergy.png",
    nut: "nut_allergy.png",
    treenut: "nut_allergy.png",
    sesame: "nut_allergy.png",
    walnut: "nut_allergy.png",
    pecan: "nut_allergy.png",
  
    fish: "fish_allergy.png",
    shellfish: "shell_fish.png",
  
    dairy: "dairy.png",
    milk: "dairy.png",
    cheese: "cheese.png",
  
    gluten: "glutten_free.png",
    wheat: "glutten_free.png",
  
    pork: "meat.png",
    beef: "meat.png",
    meat: "meat.png",
    chicken: "chicken_leg.png",
  
    vegan: "vegatarian.png",
    vegetarian: "vegatarian.png",
    kosher: "kosher.png",
    halal: "halal.png",
  };
  
  export const normalize = (s) => String(s || "").toLowerCase().trim();
  
  /** Returns the file name in /public for a label, or null if none. */
  export const getIconFile = (label) => ICONS[normalize(label)] || null;
  
  /** Short overlay text for when there’s no matching icon. */
  export const overlayText = (label) => {
    const t = normalize(label).replace(/[^a-z0-9]/g, "");
    return (t.length <= 15 ? t : t.slice(0, 15)).toUpperCase();
  };
  