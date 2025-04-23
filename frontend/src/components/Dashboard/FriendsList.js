// import React from "react";

// const FriendsList = () => {
//   const friends = [
//     "/ban_gato.png",
//     "/lebron.png",
//     "/apple.png",
//     "/miku.png",
//     "/gato.png",
//   ];

//   return (
//     <div className="friends-section">
//       <h2>Your Friends List &lt;3</h2>
//       <div className="friends-list">
//         {friends.map((src, idx) => (
//           <img key={idx} src={src} alt="Friend avatar" className="friend-avatar" />
//         ))}
//         <button className="add-friend-btn">add more friends</button>
//       </div>
//     </div>
//   );
// };

// export default FriendsList;
import React, { useRef } from "react";

const FriendsList = () => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
  };

  const friends = [
    "/ban_gato.png",
    "/lebron.png",
    "/apple.png",
    "/miku.png",
    "/gato.png",
  ];

  return (
    <div className="friends-section">
      <h2>Your Friends List &lt;3</h2>

      <div className="friends-box">
        <div className="friends-container">
          <button className="scroll-arrow" onClick={scrollLeft}>❮</button>

          <div className="friends-list-wrapper">
            <div className="friends-list" ref={scrollRef}>
              {friends.map((src, idx) => (
                <img key={idx} src={src} alt="Friend avatar" className="friend-avatar" />
              ))}
            </div>
          </div>

          <button className="scroll-arrow" onClick={scrollRight}>❯</button>
        </div>

        <div className="add-friends">
          <button className="add-friend-btn">add more friends</button>
        </div>
</div>

    </div>
  );
};

export default FriendsList;
