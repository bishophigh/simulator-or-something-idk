let cubes = [];
let particles = [];
let ripples = []; 
let spikes = []; 
let score = 0;
let highScore = 0;
let lastSpawnTime = 0;
let spawnActive = true; 

const gravity = 0.2;
const floorY = 400;
const names = ["goobert", "hubert", "bob"]; 
const lifeSpan = 20000; 
const jumpInterval = 3000; 

// Day/Night cycle
const cycleDuration = 60000; 
let isNight = false;

let spawnBtn, clearBtn, spikeBtn;

function setup() {
  let canvas = createCanvas(400, 400);
  rectMode(CENTER);
  canvas.elt.oncontextmenu = () => false;
  
  spawnBtn = createButton('Spawning: ON');
  spawnBtn.position(10, 50);
  spawnBtn.size(100, 30);
  spawnBtn.mousePressed(toggleSpawning);
  
  clearBtn = createButton('Clear All');
  clearBtn.position(120, 50);
  clearBtn.size(80, 30);
  clearBtn.mousePressed(clearAllCubes);

  spikeBtn = createButton('Generate Spikes');
  spikeBtn.position(210, 50);
  spikeBtn.size(110, 30);
  spikeBtn.mousePressed(generateSpikes);

  updateButtonStyles();

  let savedScore = localStorage.getItem("cubeHighScore");
  if (savedScore !== null) highScore = parseInt(savedScore);
}

function generateSpikes() {
  spikes = [];
  for (let i = 0; i < 3; i++) {
    let side = random() > 0.5 ? 0 : width;
    let y = random(100, floorY - 50);
    spikes.push({ x: side, y: y, side: side === 0 ? 'left' : 'right' });
  }
}

function toggleSpawning() {
  spawnActive = !spawnActive;
  spawnBtn.html(spawnActive ? 'Spawning: ON' : 'Spawning: OFF');
  updateButtonStyles();
}

function clearAllCubes() {
  while (cubes.length > 0) {
    removeCube(0, color(150));
  }
}

function createExplosion(s, pColor) {
  ripples.push({ x: s.x, y: s.y, r: 10, alpha: 255, c: pColor });
  for (let j = 0; j < 20; j++) {
    particles.push({ 
      x: s.x, 
      y: s.y, 
      vx: random(-5, 5), 
      vy: random(-5, 5), 
      alpha: 255,
      c: pColor 
    });
  }
}

function updateButtonStyles() {
  spawnBtn.style('background-color', spawnActive ? '#4CAF50' : '#f44336');
  spawnBtn.style('color', 'white');
  clearBtn.style('background-color', '#555555');
  clearBtn.style('color', 'white');
  spikeBtn.style('background-color', '#8B0000');
  spikeBtn.style('color', 'white');
}

function say(cube, message) {
  if (isNight && !cube.isImmortal && message !== "Zzz...") return; 
  cube.speech = message;
  cube.speechTime = millis();
}

function draw() {
  let now = millis();
  let cyclePos = (now % cycleDuration) / cycleDuration;
  let angle = map(cyclePos, 0, 1, PI, -PI); 
  let bgLerp = (sin(map(cyclePos, 0, 1, 0, TWO_PI)) + 1) / 2;
  let dayCol = color(135, 206, 235);
  let nightCol = color(10, 10, 35);
  background(lerpColor(nightCol, dayCol, bgLerp));
  
  isNight = bgLerp < 0.3;

  if (bgLerp <= 0.5) {
    push();
    translate(width/2, height/2 + 100);
    let celestialX = cos(angle) * 200;
    let celestialY = sin(angle) * 200;
    fill(220); stroke(180); strokeWeight(2);
    ellipse(-celestialX, -celestialY, 30, 30);
    pop();
  }

  fill(isNight ? 255 : 0); noStroke(); textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
  text("High: " + highScore, 10, 28);
  text(isNight ? "Night Time (Zzz...)" : "Day Time", 10, 85);

  for (let s of spikes) {
    fill(100); stroke(0); strokeWeight(2);
    if (s.side === 'left') triangle(0, s.y - 15, 20, s.y, 0, s.y + 15);
    else triangle(width, s.y - 15, width - 20, s.y, width, s.y + 15);
  }

  if (spawnActive && now - lastSpawnTime >= 2500) {
    let newCube = {
      x: random(100, width - 100), y: 100, size: 50,
      velocityX: random(-4, 4), velocityY: 0,
      onFloor: false, name: random(names),
      spawnTime: now, faceType: floor(random(3)),
      lastJumpTime: now, dragging: false, isImmortal: false, 
      speech: "", speechTime: 0
    };
    say(newCube, "I'm " + newCube.name + "!");
    cubes.push(newCube);
    lastSpawnTime = now;
  }

  // Particle/Ripple update
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += gravity; p.alpha -= 5;
    noStroke(); fill(red(p.c), green(p.c), blue(p.c), p.alpha);
    rect(p.x, p.y, random(3, 6), random(3, 6));
    if (p.alpha <= 0) particles.splice(i, 1);
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    let r = ripples[i]; r.r += 6; r.alpha -= 8;
    noFill(); stroke(red(r.c), green(r.c), blue(r.c), r.alpha); 
    strokeWeight(3); ellipse(r.x, r.y, r.r);
    if (r.alpha <= 0) ripples.splice(i, 1);
  }

  for (let i = cubes.length - 1; i >= 0; i--) {
    let s = cubes[i];
    if (s.isImmortal) s.spawnTime = now - (now % 1000); 

    let timeLeft = lifeSpan - (now - s.spawnTime);
    if (timeLeft <= 0) { removeCube(i, color(100)); continue; }

    if (s.dragging) {
      s.x = mouseX; s.y = mouseY;
      s.velocityX = (mouseX - pmouseX) * 0.5; s.velocityY = (mouseY - pmouseY) * 0.5;
      s.onFloor = false;
      if (frameCount % 40 === 0) say(s, random(["Eek!", "Whoa!", "High!"]));
    } else {
      s.velocityY += gravity; s.x += s.velocityX; s.y += s.velocityY;
      
      // Auto-jump logic (No vocabulary used)
      if (now - s.lastJumpTime >= jumpInterval && s.onFloor && (!isNight || s.isImmortal)) {
        s.velocityY = random(-7, -10); s.velocityX = random(-4, 4); s.onFloor = false;
        s.lastJumpTime = now;
      }
      
      // Night Snoring
      if (isNight && !s.isImmortal && s.onFloor && s.speech === "" && random() < 0.005) {
        say(s, "Zzz...");
      }
    }

    if (s.y + s.size/2 >= floorY) { s.y = floorY - s.size/2; s.velocityY = 0; s.onFloor = true; s.velocityX *= 0.9; }
    
    if (s.x < s.size/2 || s.x > width - s.size/2) {
      for (let spike of spikes) {
        if (abs(s.y - spike.y) < s.size/2 + 10) {
           if (!s.isImmortal && ((spike.side === 'left' && s.x < 35) || (spike.side === 'right' && s.x > width - 35))) {
            removeCube(i, color(200, 0, 0)); break;
          }
        }
      }
      if (cubes[i]) { s.velocityX *= -0.8; s.x = constrain(s.x, s.size/2, width - s.size/2); }
      if (!cubes[i]) continue;
    }

    let alphaVal = timeLeft < 2000 ? map(timeLeft, 0, 2000, 0, 255) : 255;
    push();
    translate(s.x, s.y);
    
    if (s.isImmortal) { fill(255, 255, 0, 100); stroke(255, 204, 0, alphaVal); strokeWeight(4); }
    else { fill(isNight ? 50 : 255, alphaVal * 0.5); stroke(isNight ? 255 : 0, alphaVal); strokeWeight(s.dragging ? 4 : 2); }
    
    let squish = s.onFloor ? 0 : map(abs(s.velocityY), 0, 15, 0, 12);
    rect(0, 0, s.size + squish, s.size - squish, 5);
    
    if (!s.isImmortal) {
      let progress = constrain(timeLeft / lifeSpan, 0, 1);
      noStroke(); fill(lerp(255, 76, progress), lerp(0, 175, progress), lerp(0, 80, progress), alphaVal);
      rectMode(CORNER); rect(-s.size/2 + 5, s.size/2 - 8, map(timeLeft, 0, lifeSpan, 0, s.size - 10), 4); rectMode(CENTER);
    }
    
    fill(isNight ? 200 : 0, alphaVal); noStroke(); textAlign(CENTER);
    text(s.name, 0, -s.size / 2 - 5);

    // SPEECH BUBBLE
    if (s.speech && now - s.speechTime < 1500 && (!isNight || s.isImmortal || s.speech === "Zzz...")) {
        let tw = textWidth(s.speech);
        let bw = tw + 20; let bh = 25; let bx = 0; let by = -s.size - 20;
        push();
        fill(255, alphaVal); stroke(0, alphaVal); strokeWeight(1);
        rect(bx, by, bw, bh, 8);
        beginShape(); vertex(-5, by + bh/2); vertex(5, by + bh/2); vertex(0, by + bh/2 + 8); endShape(CLOSE);
        fill(0, alphaVal); noStroke(); textAlign(CENTER, CENTER);
        text(s.speech, bx, by);
        pop();
    }

    if (isNight && !s.isImmortal) {
      stroke(isNight ? 200 : 0, alphaVal); line(-10, -5, -2, -5); line(2, -5, 10, -5);
    } else {
      let isFlying = s.dragging || (abs(s.velocityX) > 3.5 && !s.onFloor);
      stroke(isNight ? 255 : 0, alphaVal);
      if (isFlying) {
        line(-15, -10, -5, -5); line(15, -10, 5, -5); ellipse(-10, -2, 2, 2); ellipse(10, -2, 2, 2);
      } else {
        if (s.faceType === 0) { ellipse(-10, -5, 4, 4); ellipse(10, -5, 4, 4); arc(0, 5, 20, 15, 0, PI); }
        else if (s.faceType === 1) { line(-15, -10, -5, -5); line(15, -10, 5, -5); ellipse(-10, -2, 4, 4); ellipse(10, -2, 4, 4); }
        else if (s.faceType === 2) { ellipse(-10, -8, 6, 8); ellipse(12, -3, 4, 4); ellipse(0, 10, 10, 10); }
      }
    }
    pop();
  }
}

function removeCube(index, pColor) {
  if (index < 0 || index >= cubes.length) return;
  let s = cubes[index];
  createExplosion(s, pColor);
  cubes.splice(index, 1);
  score++;
  if (score > highScore) { highScore = score; localStorage.setItem("cubeHighScore", highScore); }
}

function mousePressed() {
  for (let i = cubes.length - 1; i >= 0; i--) {
    let s = cubes[i];
    if (mouseX > s.x - s.size/2 && mouseX < s.x + s.size/2 &&
        mouseY > s.y - s.size/2 && mouseY < s.y + s.size/2) {
      if (mouseButton === LEFT) {
        if (s.onFloor) { 
          s.velocityY = -10; s.velocityX = random(-3, 3); s.onFloor = false; 
          say(s, random(["Up!", "Wee!"])); 
        }
        s.dragging = true;
      } else if (mouseButton === RIGHT) {
        s.isImmortal = !s.isImmortal;
        say(s, s.isImmortal ? "I'm a God!" : "Normal again.");
      }
      break; 
    }
  }
}
function mouseReleased() { for (let s of cubes) s.dragging = false; }