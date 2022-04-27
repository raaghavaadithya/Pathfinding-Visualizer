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
let tutorial_done = false;
let tutorial_counter = 1;
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

class Heap {
  constructor() {
    this.heap = [];
  }

  size() {
    return this.heap.length;
  }

  insert(node) {
    this.heap.push(node);
    let currentIndex = this.heap.length - 1;

    while (true) {
      //console.log(`ParentIndex in insert: ${parentIndex}`);
      let parentIndex = max(Math.floor((currentIndex - 1) / 2), 0);
      let parentNode = this.heap[parentIndex];
      if (node.f < parentNode.f || (node.f == parentNode.f && node.h < parentNode.h)) {
        //swap
        [this.heap[currentIndex], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[currentIndex]];
      } else {
        break;
      }
      
      currentIndex = parentIndex;
    }
  }

  remove() {
    let smallestElement = this.heap[0];

    [this.heap[0], this.heap[this.heap.length - 1]] = [this.heap[this.heap.length - 1], this.heap[0]];
    this.heap.pop();
    let parentIndex = 0;

    while (true) {
      let leftChildIndex = parentIndex * 2 + 1;
      let rightChildIndex = parentIndex * 2 + 2;

      let swapIndex = 0;

      if (this.heap[leftChildIndex]) {
        //Checking which child is best to swap with
        swapIndex = leftChildIndex;
        if (this.heap[rightChildIndex]) {
          if (
            this.heap[rightChildIndex].f < this.heap[leftChildIndex].f ||
            (this.heap[rightChildIndex].f == this.heap[leftChildIndex].f && this.heap[rightChildIndex].h < this.heap[leftChildIndex].h)
          ) {
            swapIndex = rightChildIndex;
          }
        }

        let parentNode = this.heap[parentIndex];
        let swapNode = this.heap[swapIndex];
        //console.log(`ParentIndex in remove: ${parentIndex}`);


        if (swapNode.f < parentNode.f || (swapNode.f == parentNode.f && swapNode.h < parentNode.h)) {
          //swap
          [this.heap[parentIndex], this.heap[swapIndex]] = [this.heap[swapIndex], this.heap[parentIndex]];
        } else {
          break;
        }
        parentIndex = swapIndex;

      } else {
        break;
      }
    }
    return smallestElement;
  }
}

let myHeap = new Heap();

function setup() {
  createCanvas(window.innerWidth, window.innerHeight - 64);
  rows = Math.floor(height / scale);
  cols = Math.floor(width / scale);
  frameRate(30);
  background(255);

  grid = new Array(rows + 1);
  for (let i = 0; i <= rows; ++i) {
    let t = new Array(cols + 1);
    for (let j = 0; j <= cols; j++) {
      t[j] = new Block();
      t[j].x = j * scale;
      t[j].y = i * scale;
    }
    grid[i] = t;
  }

  document.querySelector(".skip-tutorial").addEventListener("click", () => {
    document.querySelector(".tutorial").classList.add("hidden");
    addAllEventListeners();
    tutorial_done = true;
  });

  document.querySelector(".next-button").addEventListener("click", nextButton);
  document.querySelector(".previous-button").addEventListener("click", prevButton);
}

function draw() {
  if (mouseIsPressed && !visualizing && tutorial_done) {
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
    document.querySelector(".selected-algo").textContent = "Algorithm: BFS";
    fill(255);
    noStroke();
    let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
    let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
    rect(gridX, gridY, scale, scale);
    grid[gridY / scale][gridX / scale].isWall = false;
  });
  document.querySelector(".a-star").addEventListener("click", () => {
    bfs_mode = false;
    document.querySelector(".selected-algo").textContent = "Algorithm: A*";
    fill(255);
    noStroke();
    let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
    let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
    rect(gridX, gridY, scale, scale);
    grid[gridY / scale][gridX / scale].isWall = false;
  });
  document.querySelector("#reset").addEventListener("click", resetPage);
};

function resetPage() {
  background(255);
  visualizing = false;
  startX = null;
  startY = null;
  endX = null;
  endY = null;
  done = false;
  retraced = false;
  document.addEventListener("keyup", buttonPressed);
  q.length = 0;
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      grid[i][j] = new Block();
      grid[i][j].x = j * scale;
      grid[i][j].y = i * scale;
    }
  }
  myHeap.heap = [];
}

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
  let gridX = Math.floor(Math.floor(mouseX) / scale) * scale;
  let gridY = Math.floor(Math.floor(mouseY) / scale) * scale;
  if (gridY / scale < rows && gridX / scale < cols) {
    if (endX != null) {
      fill(255);
      rect(endX, endY, scale, scale);
    }

    fill(0, 255, 0);
    noStroke();
    rect(gridX, gridY, scale, scale);
    endX = gridX;
    endY = gridY;
    if (grid[gridY / scale][gridX / scale].isWall) {
      grid[gridY / scale][gridX / scale].isWall = false;
    }
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
    if (q.length === 0) resetPage();
  } else if (!retraced) {
    retraceSteps(endX, endY);
    retraced = true;
  }
};

let a_star = () => {
  let starting = performance.now();
  if (!done) {
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
    k = max(1, k - 10);
    while (k-- && myHeap.size() > 0) {
      let current = myHeap.remove();
      current.seen = true;
      drawVisitedBlock(current.x, current.y);
      if (current.x === endX && current.y === endY) {
        done = true;
        fill(0, 255, 0);
        rect(endX, endY, scale, scale);
        return;
      }
      for (let i = 0; i < 8; i++) {
        let new_x = current.x + dirs[i][0];
        let new_y = current.y + dirs[i][1];

        if (!inBounds(new_x, new_y) || grid[new_y / scale][new_x / scale].seen) {
          continue;
        }

        let neighbour = grid[new_y / scale][new_x / scale];

        let newGCostOfNeighbour = current.g + getDistance(current, neighbour);
        // console.log(`g: ${newGCostOfNeighbour}`);

        if (newGCostOfNeighbour < neighbour.g || !neighbour.inQ) {
          neighbour.g = newGCostOfNeighbour;
          neighbour.h = getDistance(neighbour, grid[endY / scale][endX / scale]);
          // console.log(`${endX}, ${endY}`);
          neighbour.f = neighbour.g + neighbour.h;
          neighbour.prevX = current.x;
          neighbour.prevY = current.y;

          if (!neighbour.inQ) {
            myHeap.insert(neighbour);
            neighbour.inQ = true;
          }
        }
      }
    }
    if (myHeap.heap.length === 0) resetPage();
  } else if (!retraced) {
    fill(255, 0, 0);
    noStroke();
    rect(startX, startY, scale, scale);
    retraceSteps(endX, endY);
    retraced = true;
    let ending = performance.now();
    console.log(`Time taken: ${ending - starting}ms`)
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
  strokeWeight(0.5);
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

function getDistance(nodeA, nodeB) {
  let dX = abs(nodeA.x - nodeB.x);
  let dY = abs(nodeA.y - nodeB.y);

  if (dX > dY) return 14 * dY + 10 * (dX - dY);

  return 14 * dX + 10 * (dY - dX);
}

function nextButton() {
  switch (tutorial_counter) {
    case 1:
      tutorial_counter++;
      document.querySelector(".tut-title").textContent = "What is this app?";
      document.querySelector(".tut-content").textContent = "This app visualizes various pathfinding algorithms";
      document.querySelector(".tut-desc").innerHTML =
        "A pathfinding algorithm finds a path from a given starting point to an ending point.<br>They can, for example, be used to find our way out of a maze.<br>This app helps us visualize how that is done.";
      break;

    case 2:
      tutorial_counter++;
      document.querySelector(".tut-title").textContent = "Controls";
      document.querySelector(".tut-content").textContent = "These are the keyboard controls to place blocks";
      document.querySelector(".tut-desc").innerHTML =
        "<ul><li><b>Placing Walls</b>: You can place walls by simply clicking the left mouse button and dragging it around.</li><br><li><b>Placing Starting point</b>: Move the mouse to where you want to place the starting point, and press the <b>S</b> key.</li><br><li><b>Placing Ending point</b>: Move the mouse to where you want to place the starting point, and press the <b>E</b> key.</li></ul>These controls are always available in the <b>Controls</b> dropdown menu.";
      break;

    case 3:
      tutorial_counter++;
      document.querySelector(".next-button").textContent = "Finish";
      document.querySelector(".tut-title").textContent = "Visualizing!";
      document.querySelector(".tut-content").innerHTML = "<br>";
      document.querySelector(".tut-desc").innerHTML =
        "<ol><li>Select an algorithm from the <b>Algorithm</b> dropdown menu. It defaults to BFS.</li><br><li>To visualize, press the <b>V</b> key.</li><br><li>You can control the speed of the animations with the speed slider.</li><br><li>To reset everything, click on the <b>Reset</b> button</li></ol>";
      break;

    case 4:
      tutorial_done = true;
      addAllEventListeners();
      document.querySelector(".tutorial").classList.add("hidden");
      break;

    default:
      break;
  }
}

function prevButton() {
  switch (tutorial_counter) {
    case 2:
      tutorial_counter--;
      document.querySelector(".tut-title").textContent = "Welcome to Pathfinding Visualizer!";
      document.querySelector(".tut-content").textContent = "This is a tutorial to show you how you can use this app";
      document.querySelector(".tut-desc").textContent = 'To skip this tutorial, click on the "Skip" button, otherwise press "Next".';
      break;

    case 3:
      tutorial_counter--;
      document.querySelector(".tut-title").textContent = "What is this app?";
      document.querySelector(".tut-content").textContent = "This app visualizes various pathfinding algorithms";
      document.querySelector(".tut-desc").innerHTML =
        "A pathfinding algorithm finds a path from a given starting point to an ending point.<br>They can, for example, be used to find our way out of a maze.<br>This app helps us visualize how that is done.";
      break;

    case 4:
      tutorial_counter--;
      document.querySelector(".next-button").textContent = "Next";
      document.querySelector(".tut-title").textContent = "Controls";
      document.querySelector(".tut-content").textContent = "These are the keyboard controls to place blocks";
      document.querySelector(".tut-desc").innerHTML =
        "<ul><li><b>Placing Walls</b>: You can place walls by simply clicking the left mouse button and dragging it around.</li><br><li><b>Placing Starting point</b>: Move the mouse to where you want to place the starting point, and press the <b>S</b> key.</li><br><li><b>Placing Ending point</b>: Move the mouse to where you want to place the starting point, and press the <b>E</b> key.</li></ul>These controls are always available in the <b>Controls</b> dropdown menu.";
      break;

    default:
      break;
  }
}
