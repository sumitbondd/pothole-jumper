// --- Game States ---
const START_SCREEN = 0;
const PLAYING = 1;
const PAUSED = 2;
const GAME_OVER = 3;
let gameState = START_SCREEN;

// --- Game Variables ---
let ball;
let platformY;
let potholes = [];
let coins = [];
let particles = [];
let scorePopups = [];

let score = 0;
let finalScore = 0;
let basePlatformSpeed = 4.5; // Speed setting
let platformSpeed = basePlatformSpeed;
let speedIncreaseFactor = 0.001;

let lastPotholeX = 0;
let minPotholeDist = 220;
let maxPotholeDistFactor = 1.8;

let clouds = [];
let replayButton;
let pauseButton;

// --- Nickname Input ---
let nicknameInput;
let startButton;
let playerNickname = "Player"; // Default nickname

// --- Ball Properties ---
const ballRadius = 15;
const gravity = 0.6;
const jumpForce = 12.5;

// --- Screen Shake ---
let shakeDuration = 0;
let shakeMagnitude = 0;
const maxShakeDuration = 15;
const maxShakeMagnitude = 5;

// --- Setup ---
function setup() {
  createCanvas(windowWidth > 800 ? 800 : windowWidth, 450);
  platformY = height - 60;

  // Create Input Elements (but hide them initially)
  createInputElements();

  initializeGame(); // Sets up ball, buttons, shows input elements

  // Initialize Clouds
  for (let i = 0; i < 5; i++) {
    clouds.push({
      x: random(width * 1.5), y: random(50, height * 0.4),
      size: random(40, 80), speed: random(0.2, 0.7)
    });
  }

  textAlign(CENTER, CENTER);
  textFont('Verdana');
}

// --- Create DOM elements for Start Screen ---
function createInputElements() {
    // Nickname Input Field
    nicknameInput = createInput('');
    nicknameInput.position(width / 2 - 100, height / 2 + 0); // Centered below title
    nicknameInput.size(200, 25); // Width, Height
    nicknameInput.attribute('placeholder', 'Enter your nickname');
    nicknameInput.style('font-size', '16px');
    nicknameInput.style('text-align', 'center');
    nicknameInput.hide(); // Initially hidden

    // Start Button
    startButton = createButton('Start Game');
    startButton.position(width / 2 - 60, height / 2 + 45); // Below input
    startButton.size(120, 35);
    startButton.style('font-size', '16px');
    startButton.mousePressed(startGame); // Link button click to startGame function
    startButton.hide(); // Initially hidden
}

// --- Initialize / Reset Game Variables ---
function initializeGame() {
  // Ball
  ball = {
    x: width / 4, y: platformY - ballRadius, velocityY: 0,
    radius: ballRadius, onGround: true
  };

  // Buttons
  replayButton = { w: 120, h: 50 };
  pauseButton = { x: width - 55, y: 10, w: 45, h: 30 };

  // Reset Game State Variables
  score = 0;
  finalScore = 0;
  playerNickname = "Player"; // Reset to default on replay
  platformSpeed = basePlatformSpeed;
  potholes = [];
  coins = [];
  particles = [];
  scorePopups = [];
  lastPotholeX = width + random(100, 200);
  generateInitialPotholes();

  // Show Start Screen elements
  if (nicknameInput) nicknameInput.show();
  if (startButton) startButton.show();
  if (nicknameInput) nicknameInput.value(''); // Clear input field

  gameState = START_SCREEN;
}

// --- Start Game Function (called by button) ---
function startGame() {
    let name = nicknameInput.value();
    // Use entered name if not empty, otherwise keep default "Player"
    if (name.trim() !== '') {
        playerNickname = name.trim();
    } else {
        playerNickname = "Player"; // Explicitly set default if empty/whitespace
    }

    // Hide input elements
    nicknameInput.hide();
    startButton.hide();

    // Start the game
    gameState = PLAYING;
}


// --- Draw Loop ---
function draw() {
  applyScreenShake();
  drawBackgroundAndClouds();

  // State Machine
  switch (gameState) {
    case START_SCREEN:
      drawStaticElements();
      drawScore(); // Show 0
      drawStartScreen(); // Draws overlay and text instructions
      // Input field and button are DOM elements, drawn on top by browser
      break;
    case PLAYING:
      runGame();
      drawPauseButton();
      break;
    case PAUSED:
      drawStaticElements();
      drawScore();
      updateAndDrawParticles(false);
      updateAndDrawScorePopups(false);
      drawPauseScreen();
      break;
    case GAME_OVER:
      drawStaticElements();
      drawScore(); // Show final score
      updateAndDrawParticles(false);
      updateAndDrawScorePopups(false);
      drawGameOverScreen(); // Draws overlay, score, replay button AND nickname message
      break;
  }

  resetMatrix();
  shakeDuration = max(0, shakeDuration - 1);
  if (shakeDuration === 0) shakeMagnitude = 0;
}

// --- Helper to draw non-moving elements ---
function drawStaticElements() {
    drawPotholes();
    drawCoins();
    drawBall();
}

// --- Background & Scenery (No changes needed here) ---
function drawBackgroundAndClouds() {
  background(135, 206, 250);
  fill(255, 255, 255, 200);
  noStroke();
  for (let i = clouds.length - 1; i >= 0; i--) {
    let cloud = clouds[i];
    if (gameState === PLAYING) { cloud.x -= cloud.speed * (platformSpeed / basePlatformSpeed); }
    ellipse(cloud.x, cloud.y, cloud.size, cloud.size * 0.6);
    ellipse(cloud.x + cloud.size * 0.3, cloud.y + cloud.size * 0.1, cloud.size * 0.8, cloud.size * 0.5);
    ellipse(cloud.x - cloud.size * 0.3, cloud.y + cloud.size * 0.1, cloud.size * 0.7, cloud.size * 0.4);
    if (cloud.x + cloud.size < 0 && gameState === PLAYING) {
        cloud.x = width + random(50, 150); cloud.y = random(50, height * 0.4); cloud.speed = random(0.2, 0.7);
    }
  }
  fill(80, 160, 80); rect(0, platformY, width, height - platformY);
  fill(120, 200, 120); rect(0, platformY, width, 5);
}

// --- Game State Screens ---
function drawStartScreen() {
  // Draw background overlay
  fill(0, 0, 0, 150);
  rect(0, 0, width, height);

  // Draw Titles and Instructions (Positioned around the DOM elements)
  fill(255);
  textSize(48);
  text("Pothole Jumper", width / 2, height / 2 - 100); // Title above input

  textSize(20);
  text("Enter Nickname & Click Start", width / 2, height / 2 - 40); // Instruction above input

  textSize(18);
  text("SPACE to Jump | P to Pause", width / 2, height / 2 + 100); // Controls below button
  text("Avoid potholes! Collect coins!", width / 2, height / 2 + 130);
}

function drawPauseScreen() {
  drawPauseButton(true);
  fill(0, 0, 0, 100); rect(0, 0, width, height);
  fill(255); textSize(48); text("PAUSED", width / 2, height / 2);
  textSize(24); text("Click Pause Button or Press 'P' to Resume", width / 2, height / 2 + 50);
}

function drawGameOverScreen() {
  fill(200, 0, 0, 180);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER, CENTER);

  textSize(64);
  text("GAME OVER", width / 2, height / 2 - 100); // Move up slightly

  textSize(32);
  text("Final Score: " + finalScore, width / 2, height / 2 - 30); // Move score up

  // --- START: Add Nickname Thank You Message ---
  textSize(24); // Good size for the message
  text('Thank you for playing, ' + playerNickname + '!', width / 2, height / 2 + 10); // Position below score
  // --- END: Add Nickname Thank You Message ---

  // Replay Button Visuals (Position relative to new layout)
  let btnX = width / 2 - replayButton.w / 2;
  let btnY = height / 2 + 50; // Move button down
  let hover = mouseX > btnX && mouseX < btnX + replayButton.w && mouseY > btnY && mouseY < btnY + replayButton.h;
  fill(hover ? color(60, 220, 60) : color(50, 180, 50));
  stroke(255); strokeWeight(2); rect(btnX, btnY, replayButton.w, replayButton.h, 10);
  noStroke(); fill(255); textSize(24); text("Replay", width / 2, btnY + replayButton.h / 2);

  // Creator Credit (Position below replay button)
  fill(255); textSize(18);
  text("Created with ❤️ by Sumit Yadav", width / 2, btnY + replayButton.h + 30); // Adjust spacing as needed

  textAlign(CENTER, CENTER);
}

// --- Pause Button (No changes needed) ---
function drawPauseButton(isPaused = false) { /* ... same as before ... */ }
function drawPauseButton(isPaused = false) {
    let btn = pauseButton;
    let hover = mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
    if (isPaused) { fill(255, 165, 0); } else { fill(hover ? color(200, 200, 220) : color(180, 180, 200)); }
    stroke(50); strokeWeight(1); rect(btn.x, btn.y, btn.w, btn.h, 5);
    noStroke(); fill(50);
    if (isPaused) { triangle(btn.x + btn.w * 0.35, btn.y + btn.h * 0.25, btn.x + btn.w * 0.35, btn.y + btn.h * 0.75, btn.x + btn.w * 0.75, btn.y + btn.h * 0.5); }
    else { rect(btn.x + btn.w * 0.3, btn.y + btn.h * 0.25, btn.w * 0.15, btn.h * 0.5); rect(btn.x + btn.w * 0.55, btn.y + btn.h * 0.25, btn.w * 0.15, btn.h * 0.5); }
}

// --- Running Game Logic (No changes needed) ---
function runGame() { /* ... same as before ... */ }
function runGame() {
  updatePotholes(); updateCoins(); updateBall(); updateScoreAndDifficulty(); checkCollisions(); generatePotholes();
  drawStaticElements(); updateAndDrawParticles(); updateAndDrawScorePopups(); drawScore();
}

// --- Ball Functions (No changes needed) ---
function updateBall() { /* ... same as before ... */ }
function drawBall() { /* ... same as before ... */ }
function jump() { /* ... same as before ... */ }
function updateBall() { ball.velocityY += gravity; ball.y += ball.velocityY; ball.onGround = false; if (ball.y + ball.radius >= platformY) { let inPothole = false; for (let p of potholes) { if (ball.x > p.x && ball.x < p.x + p.w) { inPothole = true; break; } } if (!inPothole) { if (ball.y + ball.radius > platformY) { if (!ball.onGround) { createParticles(ball.x, platformY, 5, color(80, 160, 80)); } ball.y = platformY - ball.radius; ball.velocityY = 0; ball.onGround = true; } } } if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.velocityY *= -0.3; } }
function drawBall() { fill(255, 0, 0); noStroke(); ellipse(ball.x, ball.y, ball.radius * 2); }
function jump() { if (ball.onGround) { ball.velocityY = -jumpForce; ball.onGround = false; createParticles(ball.x, ball.y + ball.radius, 8, color(255, 255, 255, 150)); } }


// --- Pothole Functions (No changes needed) ---
function generateInitialPotholes() { /* ... same as before ... */ }
function generatePotholes() { /* ... same as before ... */ }
function addPothole() { /* ... same as before ... */ }
function updatePotholes() { /* ... same as before ... */ }
function drawPotholes() { /* ... same as before ... */ }
function generateInitialPotholes() { potholes = []; coins = []; lastPotholeX = width + random(100, 200); while(lastPotholeX < width * 2.5) { addPothole(); } }
function generatePotholes() { let currentMinDist = minPotholeDist / (platformSpeed / basePlatformSpeed); currentMinDist = max(currentMinDist, 90); let currentMaxDist = currentMinDist * maxPotholeDistFactor; let checkX = (potholes.length > 0) ? potholes[potholes.length - 1].x : -Infinity; if (potholes.length === 0 || checkX < width - random(currentMinDist, currentMaxDist)) { addPothole(); } }
function addPothole() { let potholeWidth = random(40, 90); let nextX = (potholes.length > 0) ? potholes[potholes.length - 1].x : lastPotholeX; let spacing = random(minPotholeDist, minPotholeDist * maxPotholeDistFactor) * (basePlatformSpeed / platformSpeed); potholeX = nextX + spacing; potholeX = max(potholeX, lastPotholeX + 80); let newPothole = { x: potholeX, y: platformY, w: potholeWidth, h: height - platformY, scored: false }; potholes.push(newPothole); lastPotholeX = potholeX; if (random() < 0.35) { generateCoin(newPothole); } }
function updatePotholes() { for (let i = potholes.length - 1; i >= 0; i--) { potholes[i].x -= platformSpeed; if (!potholes[i].scored && potholes[i].x + potholes[i].w < ball.x) { score += 5; potholes[i].scored = true; createScorePopup('+5', potholes[i].x + potholes[i].w / 2, platformY - 20); } if (potholes[i].x + potholes[i].w < -50) { potholes.splice(i, 1); } } }
function drawPotholes() { fill(40, 40, 40); noStroke(); for (let pothole of potholes) { rect(pothole.x, pothole.y, pothole.w, pothole.h, 3); } }


// --- Coin Functions (No changes needed) ---
function generateCoin(pothole) { /* ... same as before ... */ }
function updateCoins() { /* ... same as before ... */ }
function drawCoins() { /* ... same as before ... */ }
function checkCoinCollision() { /* ... same as before ... */ }
function generateCoin(pothole) { coins.push({ x: pothole.x + pothole.w / 2, y: platformY - ball.radius * 2 - random(25, 60), radius: 10, collected: false, bobOffset: random(TWO_PI), bobSpeed: random(0.05, 0.1) }); }
function updateCoins() { for (let i = coins.length - 1; i >= 0; i--) { let coin = coins[i]; coin.x -= platformSpeed; coin.bobOffset += coin.bobSpeed; if (coin.x + coin.radius < -50) { coins.splice(i, 1); } } }
function drawCoins() { noStroke(); for (let coin of coins) { if (!coin.collected) { push(); translate(coin.x, coin.y + sin(coin.bobOffset) * 3); fill(255, 215, 0); ellipse(0, 0, coin.radius * 2); fill(255, 255, 150, 180); ellipse(-coin.radius*0.2, -coin.radius*0.2, coin.radius*0.6, coin.radius*0.6); pop(); } } }
function checkCoinCollision() { for (let i = coins.length - 1; i >= 0; i--) { let coin = coins[i]; if (!coin.collected) { let d = dist(ball.x, ball.y, coin.x, coin.y + sin(coin.bobOffset) * 3); if (d < ball.radius + coin.radius) { coin.collected = true; score += 25; createScorePopup('+25', coin.x, coin.y, color(255, 215, 0)); createParticles(coin.x, coin.y, 15, color(255, 215, 0, 180)); coins.splice(i, 1); } } } }


// --- Particle Functions (No changes needed) ---
function createParticles(x, y, count, pColor) { /* ... same as before ... */ }
function updateAndDrawParticles(shouldMove = true) { /* ... same as before ... */ }
function createParticles(x, y, count, pColor) { for (let i = 0; i < count; i++) { particles.push({ x: x, y: y, vx: random(-2.5, 2.5), vy: random(-3.5, 0.5), alpha: 255, size: random(3, 6), color: pColor || color(255) }); } }
function updateAndDrawParticles(shouldMove = true) { noStroke(); for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; if (shouldMove) { p.x += p.vx; p.y += p.vy; p.vy += gravity * 0.15; } p.alpha -= 6; if (p.alpha <= 0) { particles.splice(i, 1); } else { fill(red(p.color), green(p.color), blue(p.color), p.alpha); ellipse(p.x, p.y, p.size); } } }

// --- Score Popup Functions (No changes needed) ---
function createScorePopup(text, x, y, pColor) { /* ... same as before ... */ }
function updateAndDrawScorePopups(shouldMove = true) { /* ... same as before ... */ }
function createScorePopup(text, x, y, pColor) { scorePopups.push({ text: text, x: x, y: y, alpha: 255, vy: -1.5, color: pColor || color(255) }); }
function updateAndDrawScorePopups(shouldMove = true) { textAlign(CENTER, BOTTOM); textSize(18); for (let i = scorePopups.length - 1; i >= 0; i--) { let popup = scorePopups[i]; if (shouldMove) { popup.y += popup.vy; } popup.alpha -= 5; if (popup.alpha <= 0) { scorePopups.splice(i, 1); } else { fill(red(popup.color), green(popup.color), blue(popup.color), popup.alpha); text(popup.text, popup.x, popup.y); } } textAlign(CENTER, CENTER); }

// --- Collision & Game Over (No changes needed) ---
function checkCollisions() { /* ... same as before ... */ }
function triggerGameOver() { /* ... same as before ... */ }
function checkCollisions() { for (let pothole of potholes) { let ballBottomY = ball.y + ball.radius; if (ball.x > pothole.x && ball.x < pothole.x + pothole.w) { if (ballBottomY > platformY && ball.y < platformY + 20) { triggerGameOver(); ball.y = platformY + ball.radius; ball.velocityY = 0; return; } } } checkCoinCollision(); }
function triggerGameOver() { if (gameState === PLAYING) { gameState = GAME_OVER; finalScore = floor(score); triggerScreenShake(maxShakeMagnitude, maxShakeDuration); } }


// --- Score & Difficulty (No changes needed) ---
function updateScoreAndDifficulty() { /* ... same as before ... */ }
function drawScore() { /* ... same as before ... */ }
function updateScoreAndDifficulty() { score += platformSpeed * 0.01; platformSpeed += speedIncreaseFactor; }
function drawScore() { fill(255); textSize(32); textAlign(LEFT, TOP); let displayScore = (gameState === PLAYING || gameState === PAUSED) ? floor(score) : finalScore; text("Score: " + displayScore, 20, 20); textAlign(CENTER, CENTER); }


// --- Screen Shake (No changes needed) ---
function triggerScreenShake(magnitude, duration) { /* ... same as before ... */ }
function applyScreenShake() { /* ... same as before ... */ }
function triggerScreenShake(magnitude, duration) { shakeMagnitude = magnitude; shakeDuration = duration; }
function applyScreenShake() { if (shakeDuration > 0 && gameState === GAME_OVER) { translate(random(-shakeMagnitude, shakeMagnitude), random(-shakeMagnitude, shakeMagnitude)); } }


// --- Input Handling ---
function keyPressed() {
  // Space Bar only for Jumping now (not starting)
  if (keyCode === 32) {
    if (gameState === PLAYING) {
      jump();
    }
     return false;
  }

  // 'P' key for Pause / Resume
  if (keyCode === 80) {
     if (gameState === PLAYING) { gameState = PAUSED; }
     else if (gameState === PAUSED) { gameState = PLAYING; }
  }

   // Optional: Allow Enter key to start game if input is focused
   // Requires more complex DOM focus checking, keeping it simple for now
}

function mousePressed() {
  // Pause Button Click
  if (gameState === PLAYING || gameState === PAUSED) {
      let btn = pauseButton;
      if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
          gameState = (gameState === PLAYING) ? PAUSED : PLAYING;
          return;
      }
  }

  // Replay Button Click
  if (gameState === GAME_OVER) {
    let btn = replayButton;
    let btnX = width / 2 - btn.w / 2;
    let btnY = height / 2 + 50; // Adjusted Y position
    if (mouseX > btnX && mouseX < btnX + replayButton.w && mouseY > btnY && mouseY < btnY + replayButton.h) {
      initializeGame(); // This resets and shows start screen elements
      // gameState = PLAYING; // Don't immediately start, let user click start button again
      return;
    }
  }

  // NOTE: Starting the game via mouse click is now handled EXCLUSIVELY by the startButton's mousePressed event.
  // We removed the generic `if (gameState === START_SCREEN)` check here.
}

// --- Window Resize ---
function windowResized() {
  resizeCanvas(windowWidth > 800 ? 800 : windowWidth, 450);
  platformY = height - 60;
  // Recalculate positions of DOM elements
  if (nicknameInput) nicknameInput.position(width / 2 - 100, height / 2 + 0);
  if (startButton) startButton.position(width / 2 - 60, height / 2 + 45);
  if (pauseButton) pauseButton.x = width - 55; // Recalculate pause button position
}