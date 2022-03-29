const scale = 10;
let visualizing = false;
let startX = null;
let startY = null;
let endX = null;
let endY = null;
let grid = null;
let rows = null;
let cols = null;
let done = false;
let retraced = false;
let bfs_mode = true;
const q = [];

class Block {
  constructor() {
    this.isWall = false;
    this.prevX = null;
    this.prevY = null;
    this.seen = false;
    this.g = 0;
    this.h = 0;
    this.f = 0;
    this.x = null;
    this.y = null;
    this.inQ = false;
  }
}

class newHeap {
  constructor() {
    this.heap = [];
  }

  getMin() {
    return this.heap[0];
  }

  insert(node) {
    this.heap.push(node);
    this.heap.sort(function (a, b) {
      if (a.f < b.f) return -1;
      if (a.f > b.f) return 1;
      else {
        if (a.h < b.h) return -1;
        else if (a.h > b.h) return 1;
        else return 0;
      }
    });
  }

  remove() {
    let smallest = this.heap[0];
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();
    this.heap.sort(function (a, b) {
      if (a.f < b.f) return -1;
      if (a.f > b.f) return 1;
      else {
        if (a.h < b.h) return -1;
        else if (a.h > b.h) return 1;
        else return 0;
      }
    });
    return smallest;
  }
}

let myHeap = new newHeap();

function setup() {
  createCanvas(window.innerWidth, window.innerHeight - 65);
  rows = Math.floor(height / scale);
  cols = Math.floor(width / scale);
  frameRate(30);
  background(255);
  addAllEventListeners();

  grid = new Array(rows + 1);
  for (let i = 0; i <= rows; ++i) {
    let t = new Array(cols + 1);
    for (let j = 0; j <= cols; j++) {
      t[j] = new Block();
    }
    grid[i] = t;
  }
}

function draw() {
  if (mouseIsPressed && !visualizing) {
    drawWalls();
  }
  if (visualizing) {
    if (bfs_mode) {
      bfs();
    } else {
      a_star();
    }
  }
}

let addAllEventListeners = () => {
  document.addEventListener("keyup", buttonPressed);
  document.querySelector(".bfs").addEventListener("click", () => {
    bfs_mode = true;
    document.querySelector(".selected-algo").textContent = "BFS";
  });
  document.querySelector(".a-star").addEventListener("click", () => {
    bfs_mode = false;
    document.querySelector(".selected-algo").textContent = "A*";
  });
};

let buttonPressed = () => {
  if (!visualizing) {
    if (keyCode === 83) {
      placeStartBlock();
    }
    if (keyCode === 69) {
      placeEndBlock();
    }
    if (keyCode === 86) {
      if (startX != null && endX != null) {
        visualizing = true;
        q.push([startX, startY]);
        grid[startY / scale][startX / scale].seen = true;
        grid[startY / scale][startX / scale].x = startX;
        grid[startY / scale][startX / scale].y = startY;
        myHeap.insert(grid[startY / scale][startX / scale]);
        document.removeEventListener("keyup", buttonPressed);
      } else {
        alert("Place both the starting and ending blocks");
      }
    }
  }
};

let drawWalls = () => {
  fill(0, 0, 50);
  noStroke();
  let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
  let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
  if (!(gridX == startX && gridY == startY) && !(gridX == endX && gridY == endY)) {
    rect(gridX, gridY, scale, scale);
    try {
      grid[gridY / scale][gridX / scale].isWall = true;
    } catch {}
  }
};

let placeStartBlock = () => {
  if (startX != null) {
    fill(255);
    rect(startX, startY, scale, scale);
  }

  fill(255, 0, 0);
  noStroke();
  let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
  let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
  rect(gridX, gridY, scale, scale);
  startX = gridX;
  startY = gridY;
  if (grid[gridY / scale][gridX / scale].isWall === true) {
    grid[gridY / scale][gridX / scale].isWall = false;
  }
};

let placeEndBlock = () => {
  if (endX != null) {
    fill(255);
    rect(endX, endY, scale, scale);
  }

  fill(0, 255, 0);
  noStroke();
  let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
  let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
  rect(gridX, gridY, scale, scale);
  endX = gridX;
  endY = gridY;
  if (grid[gridY / scale][gridX / scale].isWall) {
    grid[gridY / scale][gridX / scale].isWall = false;
  }
};

let bfs = () => {
  if (!done) {
    const dirs = [0, -scale, 0, scale, 0];
    let k = document.querySelector(".speed-slider").value;

    while (k-- && q.length) {
      let [curX, curY] = q.shift();

      for (let i = 0; i < 4; i++) {
        let new_x = curX + dirs[i];
        let new_y = curY + dirs[i + 1];
        if (isValidBlock(new_x, new_y)) {
          q.push([new_x, new_y]);
          let curBlock = grid[new_y / scale][new_x / scale];
          curBlock.seen = true;
          drawVisitedBlock(new_x, new_y);
          curBlock.prevX = curX;
          curBlock.prevY = curY;

          if (new_x === endX && new_y === endY) {
            done = true;
            fill(0, 255, 0);
            rect(endX, endY, scale, scale);
            return;
          }
        }
      }
    }
  } else if (!retraced) {
    retraceSteps(endX, endY);
    retraced = true;
  }
};

let a_star = () => {
  if (!done) {
    console.log("A*");
    let dirs = [
      [scale, 0],
      [scale, scale],
      [0, scale],
      [-scale, scale],
      [-scale, 0],
      [-scale, -scale],
      [0, -scale],
      [scale, -scale],
    ];
    let k = document.querySelector(".speed-slider").value;
    while (k--) {
      let cur = myHeap.remove();
      cur.seen = true;
      drawVisitedBlock(cur.x, cur.y);
      if (cur.x === endX && cur.y === endY) {
        done = true;
        fill(0, 255, 0);
        rect(endX, endY, scale, scale);
        return;
      }
      for (let i = 0; i < 8; i++) {
        let new_x = cur.x + dirs[i][0];
        let new_y = cur.y + dirs[i][1];

        let cur_g = cur.g;
        if (cur.x == new_x || cur.y == new_y) cur_g += 10;
        else cur_g += 14;

        let cur_h = min(abs(cur.x - endX), abs(cur.y - endY)) * 14 + abs(abs(cur.x - endX) - abs(cur.y - endY)) * 10;
        let cur_f = cur_g + cur_h;

        if (!inBounds(new_x, new_y) || grid[new_y / scale][new_x / scale].seen) {
          continue;
        }

        let neighbour = grid[new_y / scale][new_x / scale];

        if (!neighbour.inQ || cur_f < neighbour.f) {
          neighbour.f = cur_f;
          neighbour.g = cur_g;
          neighbour.h = cur_h;
          neighbour.prevX = cur.x;
          neighbour.prevY = cur.y;
          neighbour.x = new_x;
          neighbour.y = new_y;
          if (!neighbour.inQ) {
            myHeap.insert(neighbour);
            neighbour.inQ = true;
          }
        }
      }
    }
  } else if (!retraced) {
    fill(255, 0, 0);
    noStroke();
    rect(startX, startY, scale, scale);
    retraceSteps(endX, endY);
    retraced = true;
  }
};

let inBounds = (x, y) => {
  if (x >= 0 && y >= 0 && x / scale < cols && y / scale < rows && !grid[y / scale][x / scale].isWall) {
    return true;
  } else {
    return false;
  }
};

let retraceSteps = (X, Y) => {
  while (true) {
    let node = grid[Y / scale][X / scale];
    if (node.prevX === startX && node.prevY === startY) return;
    drawPrevBlock(node.prevX, node.prevY);
    X = node.prevX;
    Y = node.prevY;
  }
};

let drawPrevBlock = (x, y) => {
  fill(65, 105, 200);
  strokeWeight = 0.5;
  stroke("white");
  rect(x, y, scale, scale);
};

let drawVisitedBlock = (x, y) => {
  fill(108, 215, 245);
  strokeWeight(0.5);
  stroke("white");
  rect(x, y, scale, scale);
};

let isValidBlock = (x, y) => {
  if (x >= 0 && y >= 0 && y / scale < rows && x / scale < cols && grid[y / scale][x / scale].isWall === false && grid[y / scale][x / scale].seen === false) {
    return true;
  } else {
    return false;
  }
};
