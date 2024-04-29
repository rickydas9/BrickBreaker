const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

const ballRadius = 10;
let x = canvas.width / 2;
let y = canvas.height - 50;
let dx = Math.random() * 6 - 3;
let dy = -3;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let rightPressed = false;
let leftPressed = false;
let brickRowCount = 3;
let brickColumnCount = 8;
let brickWidth = 75;
let brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 20;
let score = 0;
let particles = [];
let bricks = [];
let maxOffsetX = 5; 
let maxOffsetY = 5;
const brickExistenceProbability = 0.7; 

//Create randomized bricks with an offset and randomized hits needed
for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
        if (Math.random() < brickExistenceProbability) {
            const hitsRequired = Math.floor(Math.random() * 3) + 1;
            const offsetX = Math.floor(Math.random() * maxOffsetX) - maxOffsetX / 2; 
            const offsetY = Math.floor(Math.random() * maxOffsetY) - maxOffsetY / 2; 
            bricks[c][r] = {
                x: 0, y: 0, offsetX: offsetX, offsetY: offsetY,
                status: 1, hitsLeft: hitsRequired, maxHits: hitsRequired
            };
        } else {
            bricks[c][r] = {
                x: 0, y: 0, offsetX: 0, offsetY: 0, 
                status: 0, 
                hitsLeft: 0, maxHits: 0
            };
        }
    }
}


//Set keys for movement
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);
function keyDownHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

//Create particles whenever bricks are broken
function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.dx = (Math.random() - 0.5) * 4;
    this.dy = (Math.random() - 0.5) * 4;
    this.size = 5;
    this.life = 30;

    this.draw = function() {
        ctx.fillStyle = '#ffdd59';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    };

    this.update = function() {
        this.x += this.dx;
        this.y += this.dy;
        this.life--;
    };
}


//Create collision detection for bricks and walls; Checks for win and loss based on amount of bricks left and position of ball
let checkForWin = false;
function collisionDetection() {
    let countBricks = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status === 1 && b.hitsLeft > 0) {
                let ballLeft = x - ballRadius;
                let ballRight = x + ballRadius;
                let ballTop = y - ballRadius;
                let ballBottom = y + ballRadius;

                let brickLeft = b.x;
                let brickRight = b.x + brickWidth;
                let brickTop = b.y;
                let brickBottom = b.y + brickHeight;

                if (ballRight > brickLeft && ballLeft < brickRight && ballBottom > brickTop && ballTop < brickBottom) {
                    let overlapLeft = ballRight - brickLeft;
                    let overlapRight = brickRight - ballLeft;
                    let overlapTop = ballBottom - brickTop;
                    let overlapBottom = brickBottom - ballTop;

                    if (overlapTop < overlapBottom && overlapTop < overlapLeft && overlapTop < overlapRight) {
                        dy = -dy;
                    } else if (overlapBottom < overlapTop && overlapBottom < overlapLeft && overlapBottom < overlapRight) {
                        dy = -dy;
                    } else {
                        dx = -dx;
                    }

                    b.hitsLeft--;
                    if (b.hitsLeft <= 0) {
                        b.status = 0;
                        score++;
                        for (let i = 0; i < 5; i++) {
                            particles.push(new Particle(b.x + brickWidth / 2, b.y + brickHeight / 2));
                        }
                    }
                }
            }
            if (b.status === 1) countBricks++;
        }
    }
    if (countBricks === 0 && !checkForWin) {
        checkForWin = true;
    }
}

//Draw the speed boost and paddle size
function drawPowerUpKey() {
    const keyX = 10;  
    const keyY = canvas.height - 50;  
    const size = 20;  
    const spacing = 5;  
    const textOffset = size + spacing; 

    ctx.fillStyle = "#00FF00";  
    ctx.fillRect(keyX, keyY, size, size);
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFFFFF";  
    ctx.fillText("Speed Boost", keyX + textOffset, keyY + 15);

    ctx.fillStyle = "#FFD700";  
    ctx.fillRect(keyX, keyY + size + spacing, size, size);
    ctx.fillText("Paddle Size Increase", keyX + textOffset, keyY + size + spacing + 15);
}

//Create the speed power up
function SpeedPowerUp(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.active = true;

    this.draw = function() {
        if (this.active) {
            ctx.fillStyle = "#00FF00"; 
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
}

let speedPowerUps = [];
let speedPowerUpActive = false;
let speedPowerUpDuration = 500; 
let speedPowerUpCounter = 0;
let paddleSpeed = 7; 

//Update the paddle speed with the power up
function updatePaddleSpeed() {
    if (speedPowerUpActive) {
        paddleSpeed = 14;
        speedPowerUpCounter++;
        if (speedPowerUpCounter > speedPowerUpDuration) {
            speedPowerUpActive = false;
            paddleSpeed = 7; 
            speedPowerUpCounter = 0;
        }
    }
}

//Collision detection for the speed power up
function speedPowerUpCollisionDetection() {
    for (let i = speedPowerUps.length - 1; i >= 0; i--) {
        let pu = speedPowerUps[i];
        if (pu.active &&
            x - ballRadius < pu.x + pu.width &&
            x + ballRadius > pu.x &&
            y - ballRadius < pu.y + pu.height &&
            y + ballRadius > pu.y) {
            pu.active = false;
            speedPowerUpActive = true;
            speedPowerUpCounter = 0;
        }
    }
}

//Spawn in the speed power up
function spawnSpeedPowerUp() {
    if (Math.random() < 0.05 && speedPowerUps.length < 3) { 
        let puX = Math.random() * (canvas.width - 20);
        let puY = Math.random() * (canvas.height / 2) + 30;
        speedPowerUps.push(new SpeedPowerUp(puX, puY));
    }
}
//Create the paddle length power up
function PowerUp(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.active = true;

    this.draw = function() {
        if (this.active) {
            ctx.fillStyle = "#FFD700"; 
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    };
}

//Make the paddle bigger after hitting the power up
let powerUps = [];
let powerUpActive = false;
let powerUpDuration = 300; 
let powerUpCounter = 0;
function updatePaddle() {
    if (powerUpActive) {
        paddleWidth = 150;
        powerUpCounter++;
        if (powerUpCounter > powerUpDuration) {
            powerUpActive = false;
            paddleWidth = 75;
            powerUpCounter = 0;
        }
    }
}

//Spawn in the paddle length power up
function spawnPowerUp() {
    if (Math.random() < 0.05 && powerUps.length < 1) { 
        let puX = Math.random() * (canvas.width - 20);
        let puY = Math.random() * (canvas.height / 2) + 30;
        powerUps.push(new PowerUp(puX, puY));
    }
}

//Collision detection for the paddle length power up
function powerUpCollisionDetection() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        let pu = powerUps[i];
        if (pu.active &&
            x - ballRadius < pu.x + pu.width &&
            x + ballRadius > pu.x &&
            y - ballRadius < pu.y + pu.height &&
            y + ballRadius > pu.y) {
            pu.active = false;
            powerUpActive = true; 
            powerUpCounter = 0;
        }
    }
}

//Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

//Draw the paddle
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

//Draw the bricks
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;

                brick.x = brickX;
                brick.y = brickY;

                ctx.beginPath();
                let image = brickImages[brick.hitsLeft]; 
                if (image) {
                    ctx.drawImage(image, brickX, brickY, brickWidth, brickHeight);
                }
                ctx.closePath();
            }
        }
    }
}


//Add images for the bricks based on hits 
var perfectBrickImage = new Image();
var slightlyCrackedBrickImage = new Image();
var veryBrokenBrickImage = new Image();
var imagesLoaded = 0;
const totalImages = 3; 

var background = new Image();
background.src = "./brickBG.jpeg";

function checkAllImagesLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        draw(); 
    }
}
perfectBrickImage.onload = checkAllImagesLoaded;
slightlyCrackedBrickImage.onload = checkAllImagesLoaded;
veryBrokenBrickImage.onload = checkAllImagesLoaded;

perfectBrickImage.src = './brick.jpeg';
slightlyCrackedBrickImage.src = './crackedBrick.jpeg';
veryBrokenBrickImage.src = './brokenBrick.avif';

var brickImages = [
    null, 
    veryBrokenBrickImage, 
    slightlyCrackedBrickImage, 
    perfectBrickImage
];

//Draw the particles for breaks
function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].draw();
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

//Draw everything necessary for the game
let requestId;
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBall();
    drawPaddle();
    ctx.font = "30px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 650, 500);
    drawParticles();
    spawnPowerUp();
    spawnSpeedPowerUp();
    powerUps.forEach(pu => pu.draw());
    speedPowerUps.forEach(pu => pu.draw());
    updatePaddle();
    updatePaddleSpeed();
    powerUpCollisionDetection();
    speedPowerUpCollisionDetection();
    collisionDetection();

    x += dx;
    y += dy;

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }

    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height + ballRadius) {
        gameOver();
        return;
    } else if (y + dy > canvas.height - paddleHeight - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy * 1.05;
            dx *= 1.05;
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }

    if (paddleX < 0) {
        paddleX = 0;
    } else if (paddleX + paddleWidth > canvas.width) {
        paddleX = canvas.width - paddleWidth;
    }

    if (checkForWin && particles.length === 0) {
        displayWin();
        return;
    }
    drawPowerUpKey(); 
    requestAnimationFrame(draw);
}



//Create start again button function to restart
let gameOverFlag = false;
document.getElementById('startAgainButton').addEventListener('click', function() {
    resetGame();
    this.style.display = 'none'; 
});

//Display the Game Over
function gameOver() {
    ctx.font = "80px Jersey";
    ctx.fillStyle = "rgb(255,0,0)"; 
    ctx.fillText("Game Over", 220, 350);
    document.getElementById('startAgainButton').style.display = 'block';
    gameOverFlag = true;
    cancelAnimationFrame(requestId);
}
//Display the win for the game
function displayWin() {
    ctx.font = "80px Jersey";
    ctx.fillStyle = "rgb(0,255,0)"; 
    ctx.fillText("You Win", 235, 350);
    document.getElementById('startAgainButton').style.display = 'block';
    gameOverFlag = true;
    cancelAnimationFrame(requestId);  
}

//Reset the game for whenever the startAgain button is pressed
function resetGame() {
    powerUps = [];
    speedPowerUps = [];
    powerUpActive = false;
    speedPowerUpActive = false;
    powerUpCounter = 0;
    speedPowerUpCounter = 0;
    score = 0;
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = Math.random() * 4 - 2;
    dy = -2;
    paddleX = (canvas.width - paddleWidth) / 2;
    particles = [];
    gameOverFlag = false;
    checkForWin = false;

    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            if (Math.random() < brickExistenceProbability) {
                const hitsRequired = Math.floor(Math.random() * 3) + 1;
                const offsetX = Math.floor(Math.random() * maxOffsetX) - maxOffsetX / 2;
                const offsetY = Math.floor(Math.random() * maxOffsetY) - maxOffsetY / 2;
                bricks[c][r] = {
                    x: 0, y: 0, offsetX: offsetX, offsetY: offsetY,
                    status: 1, hitsLeft: hitsRequired, maxHits: hitsRequired
                };
            } else {
                bricks[c][r] = {
                    x: 0, y: 0, offsetX: 0, offsetY: 0,
                    status: 0,
                    hitsLeft: 0, maxHits: 0
                };
            }
        }
    }
    document.getElementById('startAgainButton').style.display = 'none';
    requestAnimationFrame(draw); 
}

