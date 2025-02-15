/******************************************************
  Global Variables
 ******************************************************/
let player;            // Player tank
let enemies = [];      // Multiple enemy tanks
let playerBullets = []; // Player bullets
let enemyBullets = [];  // Enemy bullets
let walls = [];        // Array of walls

/******************************************************
  p5.js Main Functions
 ******************************************************/
function setup() {
  createCanvas(800, 600);

  // 1) Create player tank
  player = new Tank(80, height / 2, color(0, 200, 0));
  player.hp = 3;

  // 2) Create multiple enemy tanks (example: 5 enemies)
  for (let i = 0; i < 5; i++) {
    let ex = random(width * 0.5, width - 100);
    let ey = random(80, height - 80);
    let enemyTank = new Tank(ex, ey, color(200, 0, 0));
    enemyTank.hp = 3;         // Enemy health
    enemyTank.isEnemy = true;

    // Add some state variables for “random movement” in enemy tanks
    enemyTank.roamTimer = 0;     // Wandering timer
    enemyTank.roamHeading = 0;   // Heading while wandering
    enemies.push(enemyTank);
  }

  // 3) Initialize walls (you can modify to create more complex layouts)
  setupWalls();
}

function draw() {
  background(220);

  // Draw walls
  for (let wall of walls) {
    wall.show();
  }

  // Player tank
  player.update(walls);
  player.show();

  // Enemy tank AI
  for (let e of enemies) {
    if (e.hp > 0) {
      enemyAI(e, player, walls); // Enemy random wandering + attack if player is found
      e.update(walls);
      e.show();
    }
  }

  // Player bullets
  updateAndShowBulletsAgainstEnemies(playerBullets, enemies, walls);

  // Enemy bullets
  updateAndShowBulletsAgainstPlayer(enemyBullets, player, walls);

  // Display health info
  fill(0);
  textSize(16);
  text(`Player HP: ${player.hp}`, 20, 20);

  // If you want to display enemy HP, you can do so here
  for (let i = 0; i < enemies.length; i++) {
    text(`Enemy${i+1} HP: ${enemies[i].hp}`, 20, 40 + i*20);
  }

  // Win/Loss conditions
  if (player.hp <= 0) {
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("You lost!", width / 2, height / 2);
    noLoop();
  } else {
    // Check if all enemies are defeated
    let allDead = true;
    for (let e of enemies) {
      if (e.hp > 0) {
        allDead = false;
        break;
      }
    }
    if (allDead) {
      fill(0, 255, 0);
      textSize(32);
      textAlign(CENTER, CENTER);
      text("You won!", width / 2, height / 2);
      noLoop();
    }
  }
}

/******************************************************
  Keyboard Controls (Player)
 ******************************************************/
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    player.turnLeft = true;
  } else if (keyCode === RIGHT_ARROW) {
    player.turnRight = true;
  } else if (keyCode === UP_ARROW) {
    player.forward = true;
  } else if (keyCode === DOWN_ARROW) {
    player.backward = true;
  } else if (key === ' ') {
    player.shoot(playerBullets);
  }
}

function keyReleased() {
  if (keyCode === LEFT_ARROW) {
    player.turnLeft = false;
  } else if (keyCode === RIGHT_ARROW) {
    player.turnRight = false;
  } else if (keyCode === UP_ARROW) {
    player.forward = false;
  } else if (keyCode === DOWN_ARROW) {
    player.backward = false;
  }
}

/******************************************************
  Wall Class
 ******************************************************/
class Wall {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  show() {
    push();
    fill(100);
    noStroke();
    rect(this.x, this.y, this.w, this.h);
    pop();
  }
}

/******************************************************
  Example: Build Basic Walls and Boundaries
 ******************************************************/
function setupWalls() {
  // Outer boundaries
  walls.push(new Wall(0, 0, width, 20));             // Top
  walls.push(new Wall(0, height - 20, width, 20));   // Bottom
  walls.push(new Wall(0, 0, 20, height));            // Left
  walls.push(new Wall(width - 20, 0, 20, height));   // Right

  // Central obstacles
  walls.push(new Wall(200, 100, 400, 20)); // Horizontal bar
  walls.push(new Wall(200, 250, 20, 200)); // Vertical bar
  walls.push(new Wall(400, 200, 20, 200)); // Vertical bar
  walls.push(new Wall(280, 400, 220, 20)); // Horizontal bar
}

/******************************************************
  Tank Class
 ******************************************************/
class Tank {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.r = 20;         // Collision radius
    this.heading = 0;    // Facing angle (0 degrees is to the right)
    this.turnSpeed = 3;  // Rotation speed
    this.speed = 2;      // Forward movement speed
    this.color = c;      // Tank color
    this.hp = 3;         // Health
    this.isEnemy = false;

    // Keyboard control flags (for player only)
    this.turnLeft = false;
    this.turnRight = false;
    this.forward = false;
    this.backward = false;
  }

  update(walls) {
    let oldX = this.x;
    let oldY = this.y;

    // If this is the player tank, move based on keyboard input
    if (!this.isEnemy) {
      if (this.turnLeft) {
        this.heading -= this.turnSpeed;
      }
      if (this.turnRight) {
        this.heading += this.turnSpeed;
      }

      let angle = radians(this.heading);
      if (this.forward) {
        this.x += cos(angle) * this.speed;
        this.y += sin(angle) * this.speed;
      }
      if (this.backward) {
        this.x -= cos(angle) * this.speed;
        this.y -= sin(angle) * this.speed;
      }
    }
    // If this is an enemy tank, position is changed in the AI

    // Prevent going out of bounds
    this.x = constrain(this.x, this.r, width - this.r);
    this.y = constrain(this.y, this.r, height - this.r);

    // Collision with walls: revert if collision occurs
    for (let wall of walls) {
      if (circleRectCollision(this.x, this.y, this.r, wall.x, wall.y, wall.w, wall.h)) {
        this.x = oldX;
        this.y = oldY;
        break;
      }
    }
  }

  show() {
    push();
    translate(this.x, this.y);
    rotate(radians(this.heading));

    // Treads (left and right)
    fill(60);
    rectMode(CENTER);
    rect(-this.r/2, -this.r*0.8, this.r*2, this.r*0.4, 5);
    rect(-this.r/2, this.r*0.8, this.r*2, this.r*0.4, 5);

    // Main body
    fill(this.color);
    rect(-this.r/2, 0, this.r*2, this.r*1.2, 10);

    // Circular turret on top
    ellipse(this.r*0.2, 0, this.r, this.r);

    // Gun barrel
    fill(80);
    rect(this.r, 0, this.r*1.3, this.r*0.2);

    pop();
  }

  shoot(bulletArray) {
    let angle = radians(this.heading);
    let bx = this.x + cos(angle) * (this.r + 15);
    let by = this.y + sin(angle) * (this.r + 15);
    let b = new Bullet(bx, by, this.heading, this.color);
    bulletArray.push(b);
  }
}

/******************************************************
  Bullet Class
 ******************************************************/
class Bullet {
  constructor(x, y, heading, c) {
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.speed = 5;
    this.r = 5; // Bullet radius
    this.color = c;
  }

  update() {
    let angle = radians(this.heading);
    this.x += cos(angle) * this.speed;
    this.y += sin(angle) * this.speed;
  }

  show() {
    push();
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.r * 2);
    pop();
  }

  offscreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

/******************************************************
  Player Bullets vs Multiple Enemies Collision Detection
 ******************************************************/
function updateAndShowBulletsAgainstEnemies(bullets, enemies, walls) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.update();
    b.show();

    // 1) If a bullet hits a wall, remove it
    for (let wall of walls) {
      if (circleRectCollision(b.x, b.y, b.r, wall.x, wall.y, wall.w, wall.h)) {
        bullets.splice(i, 1);
        break;
      }
    }
    if (!bullets[i]) continue;

    // 2) Check if it hits any enemy
    for (let e of enemies) {
      if (e.hp <= 0) continue;
      let d = dist(b.x, b.y, e.x, e.y);
      if (d < b.r + e.r) {
        e.hp--;
        bullets.splice(i, 1);
        break; // One bullet can only hit one enemy at a time
      }
    }

    // 3) If the bullet flies offscreen
    if (bullets[i] && bullets[i].offscreen()) {
      bullets.splice(i, 1);
    }
  }
}

/******************************************************
  Enemy Bullets vs Player Collision Detection
 ******************************************************/
function updateAndShowBulletsAgainstPlayer(bullets, player, walls) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    b.update();
    b.show();

    // 1) Bullet hits wall
    for (let wall of walls) {
      if (circleRectCollision(b.x, b.y, b.r, wall.x, wall.y, wall.w, wall.h)) {
        bullets.splice(i, 1);
        break;
      }
    }
    if (!bullets[i]) continue;

    // 2) Bullet hits player
    let d = dist(b.x, b.y, player.x, player.y);
    if (d < b.r + player.r) {
      player.hp--;
      bullets.splice(i, 1);
      continue;
    }

    // 3) Offscreen
    if (b.offscreen()) {
      bullets.splice(i, 1);
    }
  }
}

/******************************************************
  Enemy AI (Random wandering + only attacks if player is in range)
 ******************************************************/
function enemyAI(enemy, player, walls) {
  if (enemy.hp <= 0) return;

  // Record position before moving (for collision rollback)
  let oldX = enemy.x;
  let oldY = enemy.y;

  // Distance to player
  let distanceToPlayer = dist(enemy.x, enemy.y, player.x, player.y);

  // 1) If player is close, rotate and shoot
  // For example, if distance < 200, consider that “in sight”
  let ATTACK_RANGE = 200;
  if (distanceToPlayer < ATTACK_RANGE) {
    // Rotate toward player
    let angleToPlayer = degrees(atan2(player.y - enemy.y, player.x - enemy.x));
    let diff = (angleToPlayer - enemy.heading + 360) % 360;
    if (diff > 180) diff -= 360;
    let rotateStep = constrain(diff, -enemy.turnSpeed, enemy.turnSpeed);
    enemy.heading += rotateStep;

    // Optionally move slightly toward or stay in place:
    // enemy.x += cos(radians(enemy.heading)) * enemy.speed * 0.2;
    // enemy.y += sin(radians(enemy.heading)) * enemy.speed * 0.2;

    // Timed shooting
    if (!enemy.shootTimer) enemy.shootTimer = 0;
    enemy.shootTimer++;
    if (enemy.shootTimer > 60) {
      enemy.shootTimer = 0;
      enemy.shoot(enemyBullets);
    }

  } else {
    // 2) If player is not in range, wander randomly
    // If roamTimer is 0, pick a new heading and wandering time
    if (enemy.roamTimer <= 0) {
      enemy.roamHeading = random(360);         // Random direction
      enemy.roamTimer = int(random(60, 180));  // 1~3 seconds
    }
    // Move in this random direction
    enemy.heading = enemy.roamHeading;
    let angle = radians(enemy.heading);
    enemy.x += cos(angle) * enemy.speed * 0.5; // Slower speed while wandering
    enemy.y += sin(angle) * enemy.speed * 0.5;

    enemy.roamTimer--;
  }

  // Collision with walls: rollback if collision occurs
  for (let wall of walls) {
    if (circleRectCollision(enemy.x, enemy.y, enemy.r, wall.x, wall.y, wall.w, wall.h)) {
      enemy.x = oldX;
      enemy.y = oldY;
      break;
    }
  }

  // Keep enemy within the canvas
  enemy.x = constrain(enemy.x, enemy.r, width - enemy.r);
  enemy.y = constrain(enemy.y, enemy.r, height - enemy.r);
}

/******************************************************
  Circle-Rectangle Collision
 ******************************************************/
function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
  // Find the closest point on the rectangle to the circle center
  let testX = cx;
  let testY = cy;

  if (cx < rx) {
    testX = rx;
  } else if (cx > rx + rw) {
    testX = rx + rw;
  }
  if (cy < ry) {
    testY = ry;
  } else if (cy > ry + rh) {
    testY = ry + rh;
  }

  // Calculate distance from circle center to this point
  let distX = cx - testX;
  let distY = cy - testY;
  let distance = sqrt(distX * distX + distY * distY);

  return (distance <= cr);
}
