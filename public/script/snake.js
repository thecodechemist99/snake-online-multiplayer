/*
Online multiplayer snake game.
(c)2019 Florian Beck
*/

/* === socket server setup ===*/
/*  Setup of socket server connection according to https://www.youtube.com/watch?v=i6eP1Lw4gZk. */

let socket;

socket = io.connect("http://snake.florian-beck.de:3000");
socket.on("getid", getId);
socket.on("getgrid", getGrid);
socket.on("initgame", initGame);
socket.on("dirchange", changeDir);

/* === time sync === */

// check latency
/* logic based on "Actionscript for Multiplayer Games and Virtual Worlds", Jobe Makar, New Riders, 2010, pages 100ff */

let avgLatency = 0;
let latencies = [];
let sendTime = 0;
function getLatency() {
  if (sendTime != 0) {
    latencies.push(new Date().getTime() - sendTime);
  }
  if (latencies.length < 10) {
    sendTime = new Date().getTime();
    socket.emit("latencyCheck");
  } else {
    let sum = 0;
    let divider = 10;
    for (let i = 0; i < 10; i++) {
      if (latencies[i] <= 1.5 * median(latencies)) {
        sum += latencies[i];
      } else {
        divider--;
      }
    }
    avgLatency = Math.round(sum / divider);
    console.log("The average latency is " + avgLatency + " ms.");
  }
}

socket.on("latencyResponse", getLatency);

// calc median
/* source: https://www.sitepoint.com/community/t/calculating-the-average-mean/7302/2 */
function median(numbers) {
  var median = 0,
    numsLen = numbers.length;
  numbers.sort();
  if (numsLen % 2 === 0) {
    // is even
    // average of two middle numbers
    median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
  } else {
    // is odd
    // middle number only
    median = numbers[(numsLen - 1) / 2];
  }
  return median;
}

// sync game time with server

function syncTime() {
  socket.emit("timesync");
}

socket.on("timesync", syncTimeResponse);

function syncTimeResponse(timestamp) {
  game.time = timestamp + Math.round(avgLatency / 20) * 10;
  console.log("The current game time is: " + game.time);
}

// calc game time
function calcGameTime() {
  if (game.run) {
    // increase game time every 1 ms
    setTimeout(function() {
      game.time++;
      calcGameTime();
      move();
    }, 1);

    // sync game time once a second
    if (game.time % 1000 === 0) {
      syncTime();
    }
  }
}

/* === game setup === */

// get client id
let id;
function getId(data) {
  id = data.id;
  console.log(id);
  getLatency();
}

// get game init data
let grid = new Object();
function getGrid(data) {
  grid = data;
}

let me = new Object();
let player2 = new Object();
let game = new Object();
let fruit = new Object();
function initGame(data) {
  if (data.p1.id === id) {
    me = data.p1;
    player2 = data.p2;
  } else {
    me = data.p2;
    player2 = data.p1;
  }

  game = data.game;
  fruit = data.fruit;

  // exit waiting mode
  waiting = false;

  // start game time
  calcGameTime();
}

/* === Lobby === */

let waiting = true;
let waitingText = "Waiting for second player \n";
let waitingPoints = "";
let counter = 0;

/* === Game === */

let endcardText;

function draw() {
  drawField();

  if (waiting) {
    drawEndcard();
    counter++;
  } else if (game.run) {
    drawSnake(me);
    drawSnake(player2);
    drawFruit();
  } else {
    drawEndcard();
  }
}

function move() {
  if (game.time % 10 === 0) {
    moveSnake(me, player2);
    moveSnake(player2, me);
  }
}

function drawField() {
  background("#000000");
  fill("#ffffff");
  noStroke();
  textFont("Courier", "monospace");
  textAlign(LEFT, CENTER);
  textSize(15);
  text("Score: " + me.score, grid.x, grid.y / 2);
  noFill();
  stroke("#ffffff");
  strokeWeight(2);
  rect(
    grid.x,
    grid.y,
    (grid.width + 0) * grid.fieldSize,
    (grid.height + 0) * grid.fieldSize
  );
  noStroke();
}

function drawSnake(snake) {
  if (snake.id === id) {
    fill("#00ff00");
  } else {
    fill("#0000ff");
  }
  for (let i = 0; i < snake.body.length; i++) {
    rect(
      grid.x + snake.body[i][0],
      grid.y + snake.body[i][1],
      grid.fieldSize,
      grid.fieldSize
    );
  }
}

function drawFruit() {
  fill("#ff0000");
  rect(grid.x + fruit.x, grid.y + fruit.y, grid.fieldSize, grid.fieldSize);
}

function drawEndcard() {
  fill("#ffffff");
  textSize(40);
  textAlign(CENTER, CENTER);

  if (waiting) {
    if (counter % 20 === 0) {
      if (waitingPoints === "...") {
        waitingPoints = "";
      } else {
        waitingPoints += ".";
      }
    }
    text(
      waitingText + waitingPoints,
      grid.x + (grid.width * grid.fieldSize) / 2,
      grid.y + (grid.height * grid.fieldSize) / 2
    );
  } else {
    text(
      endcardText + "Click to restart.",
      grid.x + (grid.width * grid.fieldSize) / 2,
      grid.y + (grid.height * grid.fieldSize) / 2
    );
  }
}

function moveSnake(snake, opponent) {
  // move snake
  switch (snake.moveDir) {
    case 0:
      snake.y -= grid.fieldSize;
      break;
    case 1:
      snake.x += grid.fieldSize;
      break;
    case 2:
      snake.y += grid.fieldSize;
      break;
    case 3:
      snake.x -= grid.fieldSize;
      break;
  }
  // save new position
  snake.body.push([snake.x, snake.y]);
  if (snake.body.length > snake.length) {
    snake.body.shift();
  }

  // check for borders
  if (
    snake.x < 0 ||
    snake.x >= grid.width * grid.fieldSize ||
    snake.y < 0 ||
    snake.y >= grid.height * grid.fieldSize
  ) {
    hit(snake);
  }

  // check for self hit
  for (let i = 0; i < snake.length - 1; i++) {
    if (snake.x === snake.body[i][0] && snake.y === snake.body[i][1]) {
      hit(snake);
    }
  }

  // check for opponent hit
  for (let i = 0; i < opponent.length; i++) {
    if (snake.x === opponent.body[i][0] && snake.y === opponent.body[i][1]) {
      hit(snake);
    }
  }

  // eat fruit
  if (snake.x === fruit.x && snake.y === fruit.y) {
    let hitid = snake.id;
    socket.emit("eatfruit", hitid);
  }
}

function keyPressed() {
  // check for arrow or wasd key input
  switch (keyCode) {
    case UP_ARROW:
    case 87:
      me.moveDir = 0;
      break;
    case RIGHT_ARROW:
    case 68:
      me.moveDir = 1;
      break;
    case DOWN_ARROW:
    case 83:
      me.moveDir = 2;
      break;
    case LEFT_ARROW:
    case 65:
      me.moveDir = 3;
      break;
  }

  let data = me.moveDir;
  socket.emit("keyinput", data);

  // check for key input to restart
  if (!game.run && !waiting) {
    socket.emit("reset");
    waiting = true;
  }
}

function mousePressed() {
  // check for mouse input to restart
  if (!game.run && !waiting) {
    socket.emit("reset");
    waiting = true;
  }
}

/* === opponent control === */
function changeDir(data) {
  player2.moveDir = data;
}

/* === server communication === */

socket.on("won", won);
socket.on("lost", lost);
socket.on("playerupdate", updatePlayer);
socket.on("fruitupdate", updateFruit);

function hit(snake) {
  let hitid = snake.id;
  socket.emit("hit", hitid);
  if (snake.id === socket.id) {
    lost();
  } else {
    won();
  }
}

function won() {
  game.run = false;
  endcardText = "You won.\n";
}

function lost() {
  game.run = false;
  endcardText = "You lost.\n";
}

function updatePlayer(curPlayer) {
  me.length = curPlayer.length;
  me.score = curPlayer.score;
}

function updateFruit(data) {
  fruit.x = data.x;
  fruit.y = data.y;
}

// function mouseDragged() {
//   let data = {
//     x: mouseX,
//     y: mouseY
//   };

//   socket.emit("mouse", data);
// }

// const http = require("http");
// const WebSocketServer = require("websocket").server;

// const server = http.createServer();
// server.listen(9000);

// const wsServer = new WebSocketServer({
//   httpServer: server
// });

// wsServer.on("request", request => {
//   const connection = request.accept(null, request.origin);
// });
