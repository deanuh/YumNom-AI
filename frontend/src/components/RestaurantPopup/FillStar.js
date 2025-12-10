import { FaStar, FaRegStar } from "react-icons/fa";
import React from "react";

//doesnt change values on hover. For static star values.
export default function FillStar({ title = "None", value = 0 }) {

  return (
		<div className="fillstar-box">
			<h4 className="fillstar-box-title">{title}</h4>
    	<div className="fillstar-box-stars" style={{ display: "flex", gap: 4 }}>
    	  {Array.from({ length: 5 }, (_, i) => {
    	    const index = (2 * (i+1));
    	    const isFull = value >= index;
    	    const isHalf = value >= index - 1 && value < index;

    	    return (
    	      <div className="fillstar-box-stars"
    	        key={i}
    	        style={{ position: "relative", width: 28, height: 28 }}
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
