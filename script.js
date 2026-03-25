// Connect to the server
const socket = io();

const canvas = document.getElementById('paper');
const ctx = canvas.getContext('2d');

// 1. Setup Canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. State Variables
let drawing = false;
let isEraser = false;
let selectedColor = '#2c3e50'; 

// 3. Pen Style Settings
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// 4. Tool & UI Functions
function usePen() {
    isEraser = false;
    updateUI();
}

function useEraser() {
    isEraser = true;
    updateUI();
}

function updateColor(color) {
    selectedColor = color;
    usePen(); // Switch back to pen if a color is picked
}

function updateUI() {
    const penBtn = document.getElementById('penBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    if (penBtn && eraserBtn) {
        penBtn.classList.toggle('active', !isEraser);
        eraserBtn.classList.toggle('active', isEraser);
    }
}

// 5. Shared Drawing Engine (The "Ink" logic)
// This function actually puts pixels on the screen
function renderDraw(x, y, color, erasing) {
    if (erasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 30;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// 6. Local Drawing Logic (Your Mouse/Touch)
function startPosition(e) {
    drawing = true;
    draw(e); 
}

function finishedPosition() {
    drawing = false;
    ctx.beginPath(); 
}

function draw(e) {
    if (!drawing) return;

    // Get coordinates
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    // 1. Draw on YOUR screen locally
    renderDraw(x, y, selectedColor, isEraser);

    // 2. Send these coordinates to the SERVER so SHE can see them
    socket.emit('drawing', { 
        x: x, 
        y: y, 
        color: selectedColor, 
        eraser: isEraser 
    });
}

// 7. Remote Drawing Logic (Listening for HER)
socket.on('drawing', (data) => {
    // Draw her lines using the data sent from the server
    renderDraw(data.x, data.y, data.color, data.eraser);
});

// 8. Clear Board Logic
function clearCanvas() {
    if (confirm("Clear the paper for both of us?")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear'); // Tell the server to tell her to clear
    }
}

socket.on('clear', () => {
    // When the server says "clear", wipe your screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 9. Event Listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

// Touch support for mobile phones
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startPosition(e); }, {passive: false});
canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e); }, {passive: false});