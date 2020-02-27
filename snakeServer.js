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

console.log("Socket server listening on port " + port + " ...");

/* === setup websocket connection === */

let socket = require("socket.io");
let io = socket(server);

let users = [];

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
  /* == general communication == */

  // save socket to user array
  users.push({ socket: socket, id: socket.id });

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
      (this.socket = socket),
      (this.x =
        Math.floor(Math.random() * (grid.width / 2) + grid.width / 4) *
        grid.fieldSize),
      (this.y =
        Math.floor(Math.random() * (grid.height / 2) + grid.height / 4) *
        grid.fieldSize)
    )
  );

  console.log("New player with ID " + socket.id + " connected.");

  // create new game if 2 player in queue
  if (queue.length >= 2) {
    newGame();
  }

  /* == game based input == */

  // reset game
  socket.on("reset", id => {
    let game = games[getGameIndex(id)];
    if (game != undefined) {
      let index = game.index;
      resetGame(game, id);
      socket.leave("game-" + index);
    }
  });

  socket.on("disconnect", () => {
    console.log("Player " + socket.id + " disconnected.");

    let game = games[getGameIndex(socket.id)];
    if (game != undefined) {
      let index = game.index;
      resetGameOnDisconnect(socket, game);
      socket.leave("game-" + index);
    } else {
      queue.splice(0, 1);
    }

    // delete user from user array
    let userIndex = users.findIndex(user => user.id === socket.id);
    users.splice(userIndex, 1);
  });

  /* movement */

  // change direction
  socket.on("keyinput", data => {
    let game = games[getGameIndex(data.id)];
    if (game.run) {
      updateDir(game, data);
    }
  });
}

/* == game == */

function newGame() {
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

  // join game room
  let room = "game-" + game.index;

  let player1_index = users.findIndex(user => user.id === player1.id);
  let player2_index = users.findIndex(user => user.id === player2.id);

  let socket1 = users[player1_index].socket;
  let socket2 = users[player2_index].socket;

  socket1.join(room);
  socket2.join(room);

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
}

function timeGame(game) {
  if (game.player.length > 1) {
    // calc snake movement
    calcSnakeMovement(game, game.player[0]);
    calcSnakeMovement(game, game.player[1]);

    // update player
    updatePlayer(game);
  }
}

function getGameIndex(playerId) {
  let gameIndex;
  for (let i = 0; i < games.length; i++) {
    if (games[i].player.length > 1) {
      if (
        games[i].player[0].id === playerId ||
        games[i].player[1].id === playerId
      ) {
        gameIndex = i;
        break;
      }
    } else {
      if (games[i].player[0].id === playerId) {
        gameIndex = i;
        break;
      }
    }
  }
  return gameIndex;
}

function recalcGameIndices() {
  for (let i = 0; i < games.length; i++) {
    games[i].index = i;
  }
}

function resetGameOnDisconnect(socket, game) {
  /* reset game on disconect */

  let playerIndex;
  let player2;
  if (game.player.length === 2) {
    if (socket.id === game.player[0].id) {
      playerIndex = 0;
      player2 = game.player[1];
    } else {
      playerIndex = 1;
      player2 = game.player[0];
    }

    // delete player object
    game.player.splice(playerIndex, 1);

    // reset other player and put back to queue
    player2.reset();

    queue.push(player2);
    if (playerIndex === 0) {
      game.player.splice(1, 1);
    } else {
      game.player.splice(0, 1);
    }
    console.log("Player " + player2.id + " left the game.");
  } else {
    game.player.pop();
  }

  // delete game
  games.splice(game.index, 1);
  recalcGameIndices();
  console.log("Game deleted, both player left.");

  if (player2) {
    console.log("Player " + player2.id + " in queue.");
  }

  if (queue.length >= 2) {
    newGame();
  }
}

function resetGame(game, playerId) {
  /* reset game on client input */

  let playerIndex;
  let player;
  if (game.player.length === 2) {
    if (playerId === game.player[0].id) {
      playerIndex = 0;
    } else {
      playerIndex = 1;
    }
    player = game.player[playerIndex];
  } else {
    player = game.player[0];
  }

  // reset player object
  player.reset();
  updatePlayer(game);

  // put player back to queue
  queue.push(player);
  game.player.splice(playerIndex, 1);

  console.log("Player " + playerId + " left the game.");

  // delete game if both player left
  if (game.player.length === 0) {
    games.splice(game.index, 1);
    recalcGameIndices();
    console.log("Game deleted, both player left.");
  }

  console.log("Player " + playerId + " in queue.");

  if (queue.length >= 2) {
    newGame();
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

  // check for hits
  if (game.run) {
    if (checkHits(game, player)) {
      // emit events
      let opponent;
      if (player === game.player[0]) {
        opponent = game.player[1];
      } else {
        opponent = game.player[0];
      }
      io.to(opponent.id).emit("won");
      io.to(player.id).emit("lost");

      // stop game
      game.run = false;
      clearInterval(game.gameTimer);
    }
  }

  // eat fruit
  if (player.x === fruit.x && player.y === fruit.y) {
    eatFruit(game, player);
  }
}

// update direction
function updateDir(game, data) {
  let player1 = game.player[0];
  let player2 = game.player[1];

  if (player1.id === data.id) {
    correctMovement(game, player1, data);
  } else {
    correctMovement(game, player2, data);
  }

  updatePlayer(game);
}

function correctMovement(game, player, data) {
  let timestamp = new Date().getTime() - game.starttime;
  let newDir = data.dir;

  // check for time offset
  let timeDiff = timestamp - data.time;
  let index = Math.abs(Math.ceil(timeDiff / moveInt));

  if (timeDiff > moveInt) {
    // correct movement
    if (index <= player.length) {
      player.body.splice(player.body.length - index, index);

      player.x = player.body[player.body.length - 1][0];
      player.y = player.body[player.body.length - 1][1];
      player.body.pop();

      // apply dir change
      player.moveDir = newDir;

      for (let i = 0; i < index + 1; i++) {
        calcSnakeMovement(game, player);
      }
    } else {
      // calc diff between last snake segment and turning point
      let delta = (index - player.length + 1) * grid.fieldSize;

      // correct snake pos
      let dX = 0;
      let dY = 0;
      switch (player.moveDir) {
        case 0:
          dY += delta;
          break;
        case 1:
          dX -= delta;
          break;
        case 2:
          dY -= delta;
          break;
        case 3:
          dX += delta;
          break;
      }

      switch (newDir) {
        case 0:
          dY += delta;
          break;
        case 1:
          dX -= delta;
          break;
        case 2:
          dY -= delta;
          break;
        case 3:
          dX += delta;
          break;
      }

      // apply new snake pos
      player.x = player.body[0][0] + dX;
      player.y = player.body[0][1] + dY;

      // delete old body
      player.body = [];

      // move snake
      for (let i = 0; i < player.length; i++) {
        calcSnakeMovement(game, player);
      }
    }
  } else if (timeDiff < -moveInt) {
    for (let i = 0; i < index + 1; i++) {
      calcSnakeMovement(game, player);
    }

    // apply dir change
    player.moveDir = newDir;
  } else {
    // apply dir change
    player.moveDir = newDir;
  }
}

/* hit events */

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
  let data = {
    p1: game.player[0],
    p2: game.player[1],
    time: new Date().getTime() - game.starttime
  };
  io.in("game-" + game.index).emit("playerupdate", data);
}
