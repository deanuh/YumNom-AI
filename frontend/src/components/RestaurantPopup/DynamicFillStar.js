import { FaStar, FaRegStar } from "react-icons/fa";
import React, { useState } from "react";

//Fill in parameters with desired values. allow changes to value on hover.
export default function DynamicFillStar({ title = "None", value = 0, onChange }) {
  const [hover, setHover] = useState(null);
  const displayRating = hover ?? value;

  const handleMouseMove = (e, starIndex) => {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const isHalf = x < width / 2;
    setHover(isHalf ? starIndex - 1 : starIndex);
  };

  const handleClick = () => hover !== null && onChange?.(hover);
  const clearHover = () => setHover(null);

  return (
		<div className="dynamicfillstar-box">
			<h4 className="dynamicfillstar-box-title">{title}</h4>
    	<div className="dynamicfillstar-box-stars" style={{ display: "flex", gap: 4 }}>
    	  {Array.from({ length: 5 }, (_, i) => {
    	    const index = (2 * (i+1));
    	    const isFull = displayRating >= index;
    	    const isHalf = displayRating >= index - 1 && displayRating < index;

    	    return (
    	      <div className="dynamicfillstar-box-stars"
    	        key={i}
    	        style={{ position: "relative", width: 28, height: 28, cursor: "pointer" }}
    	        onMouseMove={(e) => handleMouseMove(e, index)}
    	        onMouseLeave={clearHover}
    	        onClick={handleClick}
    	      >
    	        {/* Empty Outline */}
    	        <FaRegStar size={28} color="#d1d5db" />

    	        {/* Filled Star (clipped) */}
    	        <div
    	          style={{
    	            position: "absolute",
    	            top: 0,
    	            left: 0,
    	            width: isFull ? "100%" : isHalf ? "50%" : "0%",
    	            height: "100%",
    	            overflow: "hidden",
    	          }}
    	        >
    	          <FaStar size={28} color="#3d2b6d" />
    	        </div>
    	      </div>
    	    );
    	  })}
    	</div>
		</div>
  );
}
