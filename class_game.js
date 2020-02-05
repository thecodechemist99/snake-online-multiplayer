/*
Class for general game related information.
(c)2019 Florian Beck
*/

class Game {
  constructor(starttime, player, run, time, gameTimer) {
    this.starttime = starttime;
    this.player = player;
    this.run = true;
    this.time = 0;
    this.gameTimer = null;
    this.index = 0;
  }
}

module.exports = Game;
