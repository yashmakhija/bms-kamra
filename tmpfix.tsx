// Modal opener functions for ShowtimeManager component
// Replace the existing functions with these

// Fix for Showtime Modal
const openShowtimeModal = () => {
  console.log("DEBUG: Opening showtime modal");
  
  // Set the state directly
  document.getElementById('debug-open-showtime')?.click();
  
  // This is a workaround to force React state update
  setTimeout(() => {
    setIsAddShowtimeModalOpen(true);
    console.log("DEBUG: Showtime modal should now be open");
  }, 10);
};

// Fix for Seat Section Modal
const openSeatSectionModal = () => {
  console.log("DEBUG: Opening seat section modal");
  
  // Set the state directly
  document.getElementById('debug-open-seatsection')?.click();
  
  // This is a workaround to force React state update
  setTimeout(() => {
    setIsAddSeatSectionModalOpen(true);
    console.log("DEBUG: Seat section modal should now be open");
  }, 10);
};

// Add these buttons to the component JSX (hidden)
<div style={{ display: 'none' }}>
  <button 
    id="debug-open-showtime" 
    onClick={() => setIsAddShowtimeModalOpen(true)}
  >
    Debug Open Showtime
  </button>
  <button 
    id="debug-open-seatsection" 
    onClick={() => setIsAddSeatSectionModalOpen(true)}
  >
    Debug Open Seat Section
  </button>
</div>

// Then in the corresponding button JSX:
// For showtimes column button:
<button
  onClick={openShowtimeModal}
  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-2"
  disabled={!selectedEvent}
>
  Add Showtime
</button>

// For seat sections column button:
<button
  onClick={openSeatSectionModal}
  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ml-2"
  disabled={!selectedShowtime || priceTiers.length === 0}
>
  Add Seat Section
</button>
