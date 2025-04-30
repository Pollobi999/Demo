// public/app.js
document.addEventListener("DOMContentLoaded", () => {
  // Authentication elements
  const authDiv = document.getElementById("auth");
  const whiteboardDiv = document.getElementById("whiteboard");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");

  let socket = null;

  // Register new user
  registerBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
      })
      .catch((err) => {
        console.error(err);
        alert("Registration failed.");
      });
  });

  // Login existing user
  loginBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }
    fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "Login successful.") {
          // On successful login, hide auth and show the whiteboard
          authDiv.style.display = "none";
          whiteboardDiv.style.display = "block";
          initWhiteboard();
        } else {
          alert(data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Login failed.");
      });
  });

  // Initialize the whiteboard
  function initWhiteboard() {
    // Initialize Socket.io
    socket = io();

    // Canvas setup
    const canvas = document.getElementById("board");
    const ctx = canvas.getContext("2d");

    let drawing = false;
    const current = {
      color: "black",
      size: 5,
    };

    // Event listeners for canvas drawing
    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("mouseup", onMouseUp, false);
    canvas.addEventListener("mouseout", onMouseUp, false);
    canvas.addEventListener("mousemove", throttle(onMouseMove, 10), false);

    // Receive drawing events from other clients
    socket.on("draw", (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.size, false);
    });

    // Receive clear events from other clients
    socket.on("clear", () => {
      clearCanvas();
    });

    // Toolbar: Brush size
    const brushSizeInput = document.getElementById("brushSize");
    brushSizeInput.addEventListener("input", (e) => {
      current.size = e.target.value;
    });

    // Toolbar: Color buttons
    const colorButtons = document.querySelectorAll(".color");
    colorButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        current.color = btn.getAttribute("data-color");
      });
    });

    // Toolbar: Eraser (set drawing color to white)
    const eraserBtn = document.getElementById("eraser");
    eraserBtn.addEventListener("click", () => {
      current.color = "white";
    });

    // Toolbar: Clear Canvas
    const clearBtn = document.getElementById("clearCanvas");
    clearBtn.addEventListener("click", () => {
      clearCanvas();
      socket.emit("clear");
    });

    // Draw a line on the canvas; if emit is true, send the drawing data via Socket.io
    function drawLine(x0, y0, x1, y1, color, size, emit) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.closePath();

      if (!emit) return;
      socket.emit("draw", {
        x0: x0,
        y0: y0,
        x1: x1,
        y1: y1,
        color: color,
        size: size,
      });
    }

    function onMouseDown(e) {
      drawing = true;
      current.x = e.offsetX;
      current.y = e.offsetY;
    }

    function onMouseUp(e) {
      if (!drawing) return;
      drawing = false;
      drawLine(current.x, current.y, e.offsetX, e.offsetY, current.color, current.size, true);
    }

    function onMouseMove(e) {
      if (!drawing) return;
      drawLine(current.x, current.y, e.offsetX, e.offsetY, current.color, current.size, true);
      current.x = e.offsetX;
      current.y = e.offsetY;
    }

    // Throttle function to limit the rate of events
    function throttle(callback, delay) {
      let previousCall = new Date().getTime();
      return function () {
        const time = new Date().getTime();
        if (time - previousCall >= delay) {
          previousCall = time;
          callback.apply(null, arguments);
        }
      };
    }

    // Clear the entire canvas
    function clearCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
});
