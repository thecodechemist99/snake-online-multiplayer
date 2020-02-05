/*
Online multiplayer snake game client.
(c)2020 Florian Beck
*/

/* implement testmode */
let testing = false;
let botMove = false;
let changeDirInt = 1000;

// timing correction
let lastMove = 0;
let lastDirChange = 0;
let intervalCount = 0;

/* === connect to socket server === */

let socket;
let socketId;
socket = io.connect("https://snake-online-multiplayer.herokuapp.com");

socket.on("sendid", getClientId);

function getClientId(id) {
  socketId = id;

  console.log(
    "You have successfully been connected to the server at https://snake-online-multiplayer.herokuapp.com.\nYour player ID is " +
      socketId +
      "."
  );
}

/* === general communication === */

/* == latency == */

// check latency
// logic based on "Actionscript for Multiplayer Games and Virtual Worlds", Jobe Makar, New Riders, 2010, pages 100ff

let sendTime = 0;
let latencies = [];
let avgLatency = 0;

function getLatency() {
  if (sendTime !== 0) {
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
    latencies = [];
    sendTime = 0;

    console.log("The average latency is " + avgLatency + " ms.");
  }
}

socket.on("latencyResponse", getLatency);

// calc median
// source: https://www.sitepoint.com/community/t/calculating-the-average-mean/7302/2

function median(numbers) {
  let median = 0;
  let numsLen = numbers.length;
  numbers.sort();

  if (numsLen % 2 === 0) {
    // average of two middle numbers
    median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
  } else {
    // middle number only
    median = numbers[(numsLen - 1) / 2];
  }
  return median;
}

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
});

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
getLatency();

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

  // testmode
  if (testing) {
    botMove = true;
  }
}

/* == general == */

function timeGame(me, opponent) {
  // calc snake movement
  moveSnake(me, opponent, game.starttime, true);
  moveSnake(opponent, me, game.starttime, false);

  // testmode
  if (botMove) {
    intervalCount++;
    if (intervalCount % (changeDirInt / moveInt) === 0) {
      moveBot(game.starttime, me);
    }
  }

  // check latency
  getLatency();
}

/* == draw == */

// let endcardText;

function draw() {
  drawField();

  if (game.run) {
    drawSnake(me);
    drawSnake(opponent);
    drawFruit(grid.x + fruit.x, grid.y + fruit.y, grid.fieldSize);
  } else {
    drawEndcard();
    if (waiting) counter++;
  }
}

function drawField() {
  // background
  background("#000000");

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
}

function drawEndcard() {
  fill("#ffffff");
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

  //   // check for borders
  //   if (
  //     snake.x < 0 ||
  //     snake.x >= grid.width * grid.fieldSize ||
  //     snake.y < 0 ||
  //     snake.y >= grid.height * grid.fieldSize
  //   ) {
  //     hit(snake);
  //   }
  //   // check for self hit
  //   for (let i = 0; i < snake.length - 1; i++) {
  //     if (snake.x === snake.body[i][0] && snake.y === snake.body[i][1]) {
  //       hit(snake);
  //     }
  //   }
  //   // check for opponent hit
  //   for (let i = 0; i < opponent.length; i++) {
  //     if (snake.x === opponent.body[i][0] && snake.y === opponent.body[i][1]) {
  //       hit(snake);
  //     }
  //   }
  //   // eat fruit
  //   if (snake.x === fruit.x && snake.y === fruit.y) {
  //     let hitid = snake.id;
  //     socket.emit("eatfruit", hitid);
  //   }
  // }
  // // object hit
  // function hit(snake) {
  //   let hitid = snake.id;
  //   socket.emit("hit", hitid);
  //   if (snake.id === me.id) {
  //     lost();
  //   } else {
  //     won();
  //   }
}

function moveBot(starttime, me) {
  // get timestamp
  let timestamp = new Date().getTime() - starttime;

  // calc dir change
  let newDir;

  if (me.moveDir < 3) {
    newDir = me.moveDir + 1;
  } else {
    newDir = 0;
  }

  // check for time offset
  let timeDiff = timestamp - (lastDirChange + changeDirInt);
  let index = abs(ceil(timeDiff / moveInt));
  if (timeDiff > moveInt) {
    // correct movement
    deleted = me.body.splice(me.body.length - index, index);

    me.x = me.body[me.body.length - 1][0];
    me.y = me.body[me.body.length - 1][1];

    me.body.pop();

    // apply dir change
    me.moveDir = newDir;

    for (let i = 0; i < index + 1; i++) {
      moveSnake(me, opponent, game.starttime, false);
    }
  } else if (timeDiff < -moveInt) {
    for (let i = 0; i < index + 1; i++) {
      moveSnake(me, opponent, game.starttime, false);
      added.push(me.body[player.body.length - 1]);
    }
    // apply dir change
    me.moveDir = newDir;
  } else {
    // apply dir change
    me.moveDir = newDir;
  }

  let data = {
    time: timestamp, //- (timestamp % 1000),
    dir: me.moveDir
  };

  socket.emit("keyinput", data);

  // save timestamp
  lastDirChange = timestamp;
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

    // testmode
    if (testing) {
      botMove = false;
    }
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

function drawSnakeSegment(xPos, yPos, size) {
  let pixelSize = size / 15;
  noStroke();

  // top segment
  rect(xPos + 6 * pixelSize, yPos, 3 * pixelSize, 4 * pixelSize);

  // bottom segment
  rect(
    xPos + 6 * pixelSize,
    yPos + 11 * pixelSize,
    3 * pixelSize,
    4 * pixelSize
  );

  // left segments
  rect(xPos, yPos + 5 * pixelSize, 2 * pixelSize, pixelSize);
  rect(xPos, yPos + 7 * pixelSize, 3 * pixelSize, pixelSize);
  rect(xPos, yPos + 9 * pixelSize, 2 * pixelSize, pixelSize);

  // right segments
  rect(xPos + 13 * pixelSize, yPos + 5 * pixelSize, 2 * pixelSize, pixelSize);
  rect(xPos + 12 * pixelSize, yPos + 7 * pixelSize, 3 * pixelSize, pixelSize);
  rect(xPos + 13 * pixelSize, yPos + 9 * pixelSize, 2 * pixelSize, pixelSize);

  /* circle */
  // top piece
  rect(
    xPos + 5 * pixelSize,
    yPos + 4 * pixelSize,
    5 * pixelSize,
    2 * pixelSize
  );
  // bottom piece
  rect(
    xPos + 5 * pixelSize,
    yPos + 9 * pixelSize,
    5 * pixelSize,
    2 * pixelSize
  );

  // left top
  rect(
    xPos + 4 * pixelSize,
    yPos + 5 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // right top
  rect(
    xPos + 9 * pixelSize,
    yPos + 5 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // right bottom
  rect(
    xPos + 9 * pixelSize,
    yPos + 8 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // left bottom
  rect(
    xPos + 4 * pixelSize,
    yPos + 8 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  // left piece
  rect(
    xPos + 3 * pixelSize,
    yPos + 6 * pixelSize,
    2 * pixelSize,
    3 * pixelSize
  );

  // right piece
  rect(
    xPos + 10 * pixelSize,
    yPos + 6 * pixelSize,
    2 * pixelSize,
    3 * pixelSize
  );
}

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

function drawFruit(xPos, yPos, size) {
  let pixelSize = size / 15;
  fill("#ff0000");
  noStroke();

  /* border */
  // top piece
  rect(xPos + 2 * pixelSize, yPos, 11 * pixelSize, pixelSize);

  // right piece
  rect(xPos, yPos + 2 * pixelSize, pixelSize, 11 * pixelSize);

  // bottom piece
  rect(xPos + 2 * pixelSize, yPos + 14 * pixelSize, 11 * pixelSize, pixelSize);

  // left piece
  rect(xPos + 14 * pixelSize, yPos + 2 * pixelSize, pixelSize, 11 * pixelSize);

  // top left
  rect(xPos + pixelSize, yPos + pixelSize, pixelSize, pixelSize);

  // top right
  rect(xPos + 13 * pixelSize, yPos + pixelSize, pixelSize, pixelSize);

  // bottom right
  rect(xPos + 13 * pixelSize, yPos + 13 * pixelSize, pixelSize, pixelSize);

  // bottom left
  rect(xPos + pixelSize, yPos + 13 * pixelSize, pixelSize, pixelSize);

  /* eyes */
  rect(
    xPos + 4 * pixelSize,
    yPos + 3 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );
  rect(
    xPos + 9 * pixelSize,
    yPos + 3 * pixelSize,
    2 * pixelSize,
    2 * pixelSize
  );

  /* mouth */
  rect(xPos + 3 * pixelSize, yPos + 9 * pixelSize, 9 * pixelSize, pixelSize);
  rect(xPos + 4 * pixelSize, yPos + 10 * pixelSize, 7 * pixelSize, pixelSize);
  rect(xPos + 5 * pixelSize, yPos + 11 * pixelSize, 5 * pixelSize, pixelSize);
}
