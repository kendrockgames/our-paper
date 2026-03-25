const socket = io();
const canvas = document.getElementById('paper');
const ctx = canvas.getContext('2d');

// 1. Setup Canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 2. State Variables
let drawing = false;
let isEraser = false;
let selectedColor = '#2c3e50'; 
let lastX = 0;
let lastY = 0;

// 3. Tool Settings
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
    usePen(); 
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
// This function draws a line from Point A (x0, y0) to Point B (x1, y1)
function renderDraw(x0, y0, x1, y1, color, erasing) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);

    if (erasing) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = 30;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
    }
    
    ctx.stroke();
    ctx.closePath();
}

// 6. Local Drawing Logic
function startPosition(e) {
    drawing = true;
    // Set the starting point for the line
    lastX = e.clientX || (e.touches && e.touches[0].clientX);
    lastY = e.clientY || (e.touches && e.touches[0].clientY);
}

function finishedPosition() {
    drawing = false;
}

function draw(e) {
    if (!drawing) return;

    // Current coordinates
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);

    // 1. Draw on your screen (From Last Point to Current Point)
    renderDraw(lastX, lastY, x, y, selectedColor, isEraser);

    // 2. Send the Start and End points to the Server
    socket.emit('drawing', { 
        x0: lastX, 
        y0: lastY, 
        x1: x, 
        y1: y, 
        color: selectedColor, 
        eraser: isEraser 
    });

    // 3. Update "Last Point" to the current one so the next line connects
    [lastX, lastY] = [x, y];
}

// 7. Remote Drawing Logic (Listening for HER)
socket.on('drawing', (data) => {
    renderDraw(data.x0, data.y0, data.x1, data.y1, data.color, data.eraser);
});

// 8. Clear Board Logic
function clearCanvas() {
    if (confirm("Clear the paper for both of us?")) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('clear'); 
    }
}

socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// 9. Event Listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', finishedPosition);
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    startPosition(e); 
}, {passive: false});
canvas.addEventListener('touchend', finishedPosition);
canvas.addEventListener('touchmove', (e) => { 
    e.preventDefault(); 
    draw(e); 
}, {passive: false});