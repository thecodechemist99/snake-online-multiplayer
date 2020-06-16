/*
 * Class to handle the server communication of a asyncronous game via socket.io.
 * Distributed under the MIT License.
 * (c) 2020 Florian Beck
 */

import Utils from "./utils.js";

export default class ServerHandler {
  constructor(socket) {
    this.socket = socket;
    this.latencyData = {
        sendTime: 0,
        latencies: [],
        avgLatency: 0
    }
  }

  getId() {
    return this.socket.id;
  }

  checkLatency() {
    let l = this.latencyData;
    if (l.sendTime !== 0) {
        l.latencies.push(new Date().getTime() - l.sendTime);
      }
  
      if (l.latencies.length < 10) {
        l.sendTime = new Date().getTime();
        this.socket.emit("latencyCheck", () => {
          this.checkLatency();
        });
      } else {
        let sum = 0;
        let divider = 10;
        for (let i = 0; i < 10; i++) {
          if (l.latencies[i] <= 1.5 * Utils.median(l.latencies)) {
            sum += l.latencies[i];
          } else {
            divider--;
        }
      }
      l.avgLatency = Math.round(sum / divider);
      l.latencies = [];
      l.sendTime = 0;
      console.log("The average latency is " + l.avgLatency + " ms.");
    }
  }
}