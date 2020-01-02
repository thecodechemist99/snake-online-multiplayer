/*
Snake game online multiplayer server on Node.js.
(c)2019 Florian Beck
*/

/* 
Setup of socket server connection according to https://www.youtube.com/watch?v=i6eP1Lw4gZk.
*/

/* === setup server === */

let express = require("express");
let app = express();
let server = app.listen(80);
app.use(express.static("public"));

console.log("Socket server is running...");

/* === setup websocket connection === */

let socket = require("socket.io");
let io = socket(server);
io.sockets.on("connection", newConnection);

/* === setup game === */

const grid = { x: 20, y: 50, width: 60, height: 40, fieldSize: 15 };
let queue = [];
let games = [];

let Game = require("./class_game");
let Player = require("./class_player");
let Fruit = require("./class_fruit");
let fruit = new Fruit(
  (this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize),
  (this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize)
);

/* === handle data === */

function newConnection(socket) {
  // time sync
  socket.on("latencyCheck", latencyResponse);
  function latencyResponse() {
    io.to(socket.id).emit("latencyResponse");
  }

  socket.on("timesync", sendTimestamp);
  function sendTimestamp() {
    let timestamp;
    for (let i = 0; i < games.length; i++) {
      for (let j = 0; j < 2; j++) {
        if (games[i].player[j].id === socket.id) {
          timestamp = games[i].time;
          break;
        }
      }
    }
    io.to(socket.id).emit("timesync", timestamp);
  }

  // add new player
  queue.push(
    new Player(
      (this.id = socket.id),
      (this.x = Math.floor(Math.random() * grid.width) * grid.fieldSize),
      (this.y = Math.floor(Math.random() * grid.height) * grid.fieldSize),
      (this.body = [[this.x, this.y]])
    )
  );
  let data = {
    id: socket.id
  };
  io.to(socket.id).emit("getid", data);
  console.log("New player with ID " + queue[queue.length - 1].id + " joined.");

  // send grid to new player
  data = grid;
  io.to(socket.id).emit("getgrid", data);

  // create new game if 2 player in queue
  if (queue.length >= 2) {
    newGame();
  }

  // change direction
  socket.on("keyinput", updateDir);

  function updateDir(data) {
    socket.broadcast.emit("dirchange", data);
  }

  // object hit
  socket.on("hit", detectHit);

  function detectHit(hitid) {
    console.log("Player " + hitid + " hit an object.");
    if (hitid === socket.id) {
      io.to(socket.id).emit("lost");
      for (let i = 0; i < games.length; i++) {
        for (let j = 0; j < 2; j++) {
          if (games[i].player[j].id != socket.id) {
            io.to(games[i].player[j].id).emit("won");
            break;
          }
        }
      }
    }
  }

  // eat fruit
  socket.on("eatfruit", eatFruit);

  function eatFruit(hitid) {
    if (hitid === socket.id) {
      for (let i = 0; i < games.length; i++) {
        for (let j = 0; j < 2; j++) {
          if (games[i].player[j].id === socket.id) {
            // update player
            let curPlayer = games[i].player[j];
            curPlayer.length++;
            curPlayer.score += 5;
            io.to(socket.id).emit("playerupdate", curPlayer);

            // update fruit
            fruit.relocate(grid);
            let data = fruit;
            socket.emit("fruitupdate", data);
            break;
          }
        }
      }
    }
  }

  // reset game
  socket.on("reset", resetGame);

  function resetGame() {
    // put player back to queue
    for (let i = 0; i < games.length; i++) {
      for (let j = 0; j < 2; j++) {
        if (games[i].player[j].id === socket.id) {
          // reset player object
          let curPlayer = games[i].player[j];
          curPlayer.length = 1;
          curPlayer.score = 0;

          io.to(socket.id).emit("playerupdate", curPlayer);

          // put player into queue
          queue.push(curPlayer);
          games[i].player.splice(j, 1);

          console.log("Player " + socket.id + " left the game.");

          // delete game if both player left
          if (games[i].player.length === 0) {
            games.splice(i, 1);

            console.log("Game deleted, both player left.");
          }
          break;
        }
      }
    }

    for (let i = 0; i < queue.length; i++) {
      console.log("Player " + queue[i].id + " in queue.");
    }

    if (queue.length >= 2) {
      newGame();
    }
  }

  function newGame() {
    let newGame = new Game((this.player = [queue.shift(), queue.shift()]));
    games.push(newGame);

    console.log(
      "Player " +
        newGame.player[0].id +
        " and player " +
        newGame.player[1].id +
        " joined a new game."
    );

    // set new start values
    fruit.relocate(grid);
    newGame.player[0].relocate(grid);
    newGame.player[1].relocate(grid);

    // send initialization data to player
    let data = {
      game: newGame,
      p1: newGame.player[0],
      p2: newGame.player[1],
      fruit: fruit
    };

    io.to(newGame.player[0].id).emit("initgame", data);
    io.to(newGame.player[1].id).emit("initgame", data);

    // start time
    calcGameTime(newGame);
  }

  // calc game time
  function calcGameTime(game) {
    // increase game time every 1 ms
    setTimeout(function() {
      game.time++;
      calcGameTime(game);
    }, 1);
  }

  //   socket.on("mouse", mouseMsg);

  //   function mouseMsg(data) {
  //     socket.broadcast.emit("mouse", data);
  //     console.log(data);
  //   }
}
