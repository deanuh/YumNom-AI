import React, { useRef, useEffect, useState } from "react"; // Import necessary modules from React
import io from 'socket.io-client'; // Import the socket.io client library
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig.js";




// Establish a socket connection to the server at the specified URL
export default function SendAndReceive() {
	const [sendMessage, setSendMessage] = useState("");
  const [receiveMessage, setReceiveMessage] = useState(""); // State to store received message
  const [phaseState, setPhaseState] = useState(""); // State to store received message
	const [timer, setTimer] = useState(null);
	const socketRef = useRef(null);

	const send = () => {
		if (socketRef.current) {
			socketRef.current.emit("send_message", { message: sendMessage });
		}
	}
  useEffect(() => {
		const interval = setInterval(() => { 
			setTimer(timer => {
				if (timer > 0) return timer - 1;
				clearInterval(interval);
				return 0;
			}); 
		}, 1000);

		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			try {
				if (user && !socketRef.current) {
					const user = auth.currentUser;

					const JWT = await user.getIdToken();	
					
  	  		// Listen for incoming messages from the server
					socketRef.current = io(process.env.REACT_APP_SOCKETIO_BACKEND_URL, {
						auth: { token: JWT },
					});

  	  		socketRef.current.on("change_phase", (data) => {
  	  		  setPhaseState(data.phaseName); // Set the received message data to state
						setTimer(Math.ceil((data.endsAt  - Date.now()) / 1000));
  	  		});
	
  	  		socketRef.current.on("receive_message", (data) => {
  	  		  setReceiveMessage(data.message); // Set the received message data to state
  	  		});
					socketRef.current.on("join_error", (data) => {
						console.error("Error joining room: ", data.message);
					});


					socketRef.current.emit("join_room");

  	  		// Cleanup the effect by removing the event listener when the component unmounts
				}
  	  } catch(err) {
				console.error("Error retrieving current user: ", err.message);
			}
		});


	return () => {
					clearInterval(interval);
  	  	  socketRef.current?.disconnect()
					unsubscribe();
  };
}, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div>
      <p>View Receive messages: {receiveMessage}</p> {/* Display the received message */}

      <p>View timer: { timer }, phase: { phaseState }</p> {/* Display the timer*/}
			<input placeholder="message to socket" onChange={(e) => setSendMessage(e.target.value)} />
			<button onClick={send}>Enter</button>
    </div>
  );
}
