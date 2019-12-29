/* setup file for p5.js */

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30);
}

function resizeHandler() {
  resizeCanvas(windowWidth, windowHeight);
  clear();
}

window.addEventListener("resize", resizeHandler);

new p5();
var width = windowWidth;
var height = windowHeight;
