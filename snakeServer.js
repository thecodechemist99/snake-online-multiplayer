/*
Snake game online multiplayer server on Node.js.
(c)2020 Florian Beck
*/

/* 
Setup of socket server connection according to https://www.youtube.com/watch?v=i6eP1Lw4gZk
and https://robdodson.me/deploying-your-first-node-dot-js-and-socket-dot-io-app-to-heroku/.
*/

/* === setup server === */

let express = require("express");
let app = express();
const port = process.env.PORT || 3000;
let server = app.listen(port);
app.use(express.static("public"));

console.log("Socket server listening on port 3000 ...");

/* === setup websocket connection === */

let socket = require("socket.io");
let io = socket(server);

/* === setup game === */

const grid = { x: 30, y: 50, width: 60, height: 40, fieldSize: 15 };
let queue = [];
let games = [];

let Game = require("./class_game");
let Player = require("./class_player");
let Fruit = require("./class_fruit");
let fruit = new Fruit(
  (this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize),
  (this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize)
);

// movement intervall in ms
let moveInt = 100;

/* === handle connection data === */

io.sockets.on("connection", newConnection);

function newConnection(socket) {
  // join room
  let room = "game-" + games.length;
  socket.join(room);

  /* == general communication == */

  // send socket id
  let id = socket.id;
  socket.emit("sendid", id);

  // latency check response
  socket.on("latencyCheck", () => {
    socket.emit("latencyResponse");
  });

  /* == game based communication == */

  // send grid to new player
  let data = grid;
  socket.emit("getgrid", data);

  /* == player == */

  // add new player
  queue.push(
    new Player(
      (this.id = socket.id),
      (this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize),
      (this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize)
    )
  );

  console.log("New player with ID " + socket.id + " joined room " + room + ".");

  // create new game if 2 player in queue
  if (queue.length >= 2) {
    newGame(socket);
  }
}

/* == game == */

function newGame(socket) {
  // add last 2 player in queue to new game
  let game = new Game(
    (this.starttime = new Date().getTime()),
    (this.player = [queue.shift(), queue.shift()])
  );
  games.push(game);
  game.index = games.length - 1;

  // set player vars
  let player1 = game.player[0];
  let player2 = game.player[1];

  console.log(
    "Player " + player1.id + " and player " + player2.id + " joined a new game."
  );

  // set start position values
  player1.relocate(grid);
  player2.relocate(grid);
  fruit.relocate(grid);

  // send initialization data to player
  let data = {
    game: game,
    p1: player1,
    p2: player2,
    fruit: fruit
  };

  io.to(player1.id).emit("initgame", data);
  io.to(player2.id).emit("initgame", data);

  // start game time (increase every 100 ms)
  game.gameTimer = setInterval(() => {
    timeGame(game);
  }, moveInt);

  // reset game
  socket.on("reset", id => {
    resetGame(socket, game, id);
  });

  /* movement */

  // change direction
  socket.on("keyinput", data => {
    updateDir(game, data);
  });

  //   /* hit events */

  //   // object hit
  //   socket.on("hit", () => {
  //     detectHit(game);
  //   });
}

function timeGame(game) {
  // calc snake movement
  calcSnakeMovement(game, game.player[0]);
  calcSnakeMovement(game, game.player[1]);

  // update player
  updatePlayer(game);
}

function resetGame(socket, game, playerId) {
  // set vars
  if (game.player.length === 2) {
    if (playerId === game.player[0].id) {
      let player = game.player[0];
    } else {
      let player = game.player[1];
    }
  } else {
    player = game.player[0];
  }

  // reset player object
  player.length = 1;
  player.score = 0;
  updatePlayer(game);

  // put player back to queue
  queue.push(player);
  game.player.splice(playerIndex, 1);

  console.log("Player " + playerId + " left the game.");

  // delete game if both player left
  if (game.player.length === 0) {
    games.splice(game.index, 1);

    console.log("Game deleted, both player left.");
  }

  console.log("Player " + playerId + " in queue.");

  if (queue.length >= 2) {
    newGame(socket);
  }
}

/* movement */

function calcSnakeMovement(game, player) {
  // add previous head position to body
  player.body.push([player.x, player.y]);
  if (player.body.length > player.length) {
    player.body.shift();
  }

  // calc movement
  let moveX = 0;
  let moveY = 0;

  switch (player.moveDir) {
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
  player.x += moveX;
  player.y += moveY;

  // // check for hits
  // if (checkHits(game, player)) {
  //   io.in("game-" + game.index).emit();
  // }

  // eat fruit
  if (player.x === fruit.x && player.y === fruit.y) {
    eatFruit(game, player);
  }
}

// update direction
function updateDir(game, data) {
  let player1 = game.player[0];
  let player2 = game.player[1];
  let pDir;

  if (player1.id === data.id) {
    correctMovement(game, player1, data);
  } else {
    correctMovement(game, player2, data);
  }

  updatePlayer(game);
}

function correctMovement(game, player, data) {
  // get timestamp
  let timestamp = new Date().getTime() - game.starttime;
  // calc dir change
  let newDir = data.dir;
  // check for time offset
  let timeDiff = timestamp - data.time;
  let index = Math.abs(Math.ceil(timeDiff / moveInt));
  if (timeDiff > moveInt) {
    // correct movement
    deleted = player.body.splice(player.body.length - index, index);

    player.x = player.body[player.body.length - 1][0];
    player.y = player.body[player.body.length - 1][1];
    player.body.pop();

    // apply dir change
    player.moveDir = newDir;

    for (let i = 0; i < index + 1; i++) {
      calcSnakeMovement(game, player);
    }
  } else if (timeDiff < -moveInt) {
    for (let i = 0; i < index + 1; i++) {
      calcSnakeMovement(game, player);
      added.push(player.body[player.body.length - 1]);
    }

    // apply dir change
    player.moveDir = newDir;
  } else {
    // apply dir change
    player.moveDir = newDir;
  }
}

function checkHits(game, player) {
  if (
    // check for borders
    player.x < 0 ||
    player.x >= grid.width * grid.fieldSize ||
    player.y < 0 ||
    player.y >= grid.height * grid.fieldSize ||
    // check for snake hit
    game.player[0].body.includes([player.x, player.y]) ||
    game.player[1].body.includes([player.x, player.y])
  ) {
    return true;
  } else {
    return false;
  }
}

/* hit events */

// // detect hit
// function detectHit(game, hitid) {
//   // set vars
//   let player1 = game.player[0];
//   let player2 = game.player[1];

//   if (game.run) {
//     console.log("Player " + hitid + " hit an object.");

//     // update player
//     if (player1.id === hitid) {
//       io.to(player1.id).emit("lost");
//       io.to(player2.id).emit("won");
//     } else {
//       io.to(player1.id).emit("won");
//       io.to(player2.id).emit("lost");
//     }

//     // clear timer
//     clearInterval(game.gameTimer);

//     // stop game
//     game.run = false;
//   }
// }

// eat fruit
function eatFruit(game, player) {
  // update player
  player.length++;
  player.score += 5;
  updatePlayer(game);

  // update fruit
  fruit.relocate(grid);
  let data = fruit;
  io.in("game-" + game.index).emit("fruitupdate", data);
}

/* == emit data == */

function updatePlayer(game) {
  let curTimestamp = new Date().getTime() - game.starttime;
  let data = {
    p1: game.player[0],
    p2: game.player[1],
    timestamp: curTimestamp - (curTimestamp % moveInt)
  };
  io.in("game-" + game.index).emit("playerupdate", data);
}
