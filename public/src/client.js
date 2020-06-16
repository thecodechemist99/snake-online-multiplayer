/*
Online multiplayer snake game client.
(c)2020 Florian Beck
*/

import ServerHandler from "./serverHandler.js";

/* === connect to socket server === */

// let socket = io.connect("https://snake-online-multiplayer.herokuapp.com/");
let socket = io.connect("localhost:3000");
let server = new ServerHandler(socket);

/* === general communication === */

/* == latency == */

server.checkLatency();

/* === game based communication === */

// end game
socket.on("won", won);

function won() {
  // clear timer
  clearInterval(gameTimer);

  // stop game
  game.run = false;
  endcardText = "You won.\n";
}

socket.on("lost", lost);

function lost() {
  // clear timer
  clearInterval(gameTimer);

  // stop game
  game.run = false;
  endcardText = "You lost.\n";
}

/* object updates */

// update player
socket.on("playerupdate", data => {
  // update player
  let player1 = data.p1;
  let player2 = data.p2;

  if (player1.id === socketId) {
    me = player1;
    opponent = player2;
  } else {
    me = player2;
    opponent = player1;
  }

  // correct positions
  correctPosition(me, data.time);
  correctPosition(opponent, data.time);
});

function correctPosition(player, timestamp) {
  // calc time offset
  let gameTime = new Date().getTime() - game.starttime;
  let timeDiff = gameTime - timestamp;

  // correct movement
  if (timeDiff > moveInt) {
    let offset = floor(timeDiff / moveInt);

    for (let i = 0; i < offset; i++) {
      if (player === me) {
        moveSnake(player, opponent, game.starttime, false);
      } else {
        moveSnake(player, me, game.starttime, false);
      }
    }
  }
}

// update fruit
socket.on("fruitupdate", data => {
  fruit = data;
});

/* == lobby == */

let waiting = true;
let waitingText = "Waiting for second player \n";
let waitingPoints = "";
let counter = 0;

/* === game === */

// define objects
let grid = {};
let game = {};
let me = {};
let opponent = {};
let fruit = {};

/* == setup game == */

let moveInt = 100;

// get current latency
// getLatency();

// get grid
socket.on("getgrid", data => {
  grid = data;
});

// initialize game
socket.on("initgame", initGame);

function initGame(data) {
  if (data.p1.id === socketId) {
    me = data.p1;
    opponent = data.p2;
  } else {
    me = data.p2;
    opponent = data.p1;
  }

  game = data.game;
  fruit = data.fruit;

  // exit waiting mode
  waiting = false;

  // start game time (increase every 100 ms)
  gameTimer = setInterval(() => {
    timeGame(me, opponent);
  }, moveInt);
}

/* == general == */

function timeGame(me, opponent) {
  // calc snake movement
  moveSnake(me, opponent, game.starttime, true);
  moveSnake(opponent, me, game.starttime, false);

  // check latency
  getLatency();
}

/* == draw == */

// let endcardText;

function draw() {
  background("#000000");

  if (game.run) {
    drawSnake(me);
    drawSnake(opponent);
    drawFruit(grid.x + fruit.x, grid.y + fruit.y, grid.fieldSize);
  } else {
    drawEndcard();
    if (waiting) counter++;
  }

  drawField();
}

function drawField() {
  // draw background for Border
  fill("#000000");
  rect(0, 0, grid.x, height);
  rect(0, 0, width, grid.y);
  rect(
    0,
    grid.y + grid.height * grid.fieldSize,
    width,
    height - (grid.y + grid.height * grid.fieldSize)
  );
  rect(
    grid.x + grid.width * grid.fieldSize,
    0,
    width - (grid.x + grid.width * grid.fieldSize),
    height
  );

  // border
  let borderStrength = 20;
  drawBorder(
    grid.x - borderStrength,
    grid.y - borderStrength,
    grid.width * grid.fieldSize + 2 * borderStrength,
    grid.height * grid.fieldSize + 2 * borderStrength,
    borderStrength
  );

  // text
  fill("#ff00ff");
  noStroke();
  textFont("Courier");
  textAlign(LEFT, CENTER);
  textSize(20);
  textStyle(BOLD);
  if (game.run) {
    text("Score: " + me.score, grid.x - borderStrength, grid.y / 3);
    fill("#ffff00");
    text("Opponent Score: " + opponent.score, grid.x + 120, grid.y / 3);
  } else {
    text("Score: 0", grid.x - borderStrength, grid.y / 3);
    fill("#ffff00");
    text("Opponent Score: 0", grid.x + 120, grid.y / 3);
  }
}

function drawSnake(snake) {
  if (snake.id === me.id) {
    fill("#00ff00");
  } else {
    fill("#0000ff");
  }
  for (let i = 0; i < snake.body.length; i++) {
    drawSnakeSegment(
      grid.x + snake.body[i][0],
      grid.y + snake.body[i][1],
      grid.fieldSize
    );
  }
  drawSnakeSegment(grid.x + snake.x, grid.y + snake.y, grid.fieldSize);
}

function drawEndcard() {
  fill("#dadada");
  textSize(40);
  textAlign(CENTER, CENTER);

  if (waiting) {
    if (counter % 10 === 0) {
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

/* == movement == */

function moveSnake(snake, opponent, starttime, timestamp) {
  // add previous head position to body
  snake.body.push([snake.x, snake.y]);
  if (snake.body.length > snake.length) {
    snake.body.shift();
  }

  // save timestamp
  if (timestamp === true) {
    lastMove = new Date().getTime() - starttime;
  }

  // calc movement
  let moveX = 0;
  let moveY = 0;

  switch (snake.moveDir) {
    case 0:
      moveY = -grid.fieldSize;
      break;
    case 1:
      moveX = grid.fieldSize;
      break;
    case 2:
      moveY = grid.fieldSize;
      break;
    case 3:
      moveX = -grid.fieldSize;
      break;
  }

  // apply movement
  snake.x += moveX;
  snake.y += moveY;
}

/* === user input === */

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

  if (!game.run && !waiting) {
    // check for key input to restart
    let id = me.id;
    console.log("Reset ID: " + id);
    socket.emit("reset", id);
    waiting = true;
  } else {
    // send new direction to server
    let data = {
      id: me.id,
      time: new Date().getTime() - game.starttime,
      dir: me.moveDir
    };
    socket.emit("keyinput", data);
  }
}

function mousePressed() {
  // check for mouse input to restart
  if (!game.run && !waiting) {
    let id = me.id;
    console.log("Reset ID: " + id);
    socket.emit("reset", id);
    waiting = true;
  }
}

/* === graphics === */



function drawBorder(xPos, yPos, xSize, ySize, strength) {
  fill("#ffffff");
  noStroke();

  for (let i = 0; i < ySize; i++) {
    for (let j = 0; j < xSize; j++) {
      if (
        i % 2 != 0 &&
        j % 2 != 0 &&
        (i <= strength ||
          i >= ySize - strength ||
          j <= strength ||
          j >= xSize - strength)
      ) {
        rect(xPos + j, yPos + i, 1, 1);
      }
    }
  }
}