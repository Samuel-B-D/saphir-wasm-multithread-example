const button = document.getElementById('render');
const canvas = document.getElementById('canvas');
const scene = document.getElementById('scene');
const concurrency = document.getElementById('concurrency');
const concurrencyAmt = document.getElementById('concurrency-amt');
const timing = document.getElementById('timing');
const timingVal = document.getElementById('timing-val');
const ctx = canvas.getContext('2d');

button.disabled = true;
concurrency.disabled = true;

let rendering = null;
let start = null;
let interval = null;
let pool = null;

run();

async function run() {
  const { Scene, WorkerPool, Pool } = await window.loadWasmMultithread();
  pool = Pool;

  // Configure various buttons and such.
  button.onclick = function() {
    button.disabled = true;
    console.time('render');
    let json;
    try {
      json = JSON.parse(scene.value);
    } catch(e) {
      alert(`invalid json: ${e}`);
      return
    }
    canvas.width = json.width;
    canvas.height = json.height;
    render(new Scene(json));
  };
  button.innerText = 'Render!';
  button.disabled = false;

  concurrency.oninput = function() {
    concurrencyAmt.innerText = 'Concurrency: ' + concurrency.value;
  };
  concurrency.min = 1;
  concurrency.step = 1;
  concurrency.max = navigator.hardwareConcurrency;
  concurrency.value = concurrency.max;
  concurrency.oninput();
  concurrency.disabled = false;
}

class State {
  constructor(wasm) {
    this.start = performance.now();
    this.wasm = wasm;
    this.running = true;
    this.counter = 1;

    this.interval = setInterval(() => this.updateTimer(true), 100);

    wasm.promise()
      .then(data => {
        this.updateTimer(false);
        this.updateImage(data);
        this.stop();
      })
      .catch(console.error);
  }

  updateTimer(updateImage) {
    const dur = performance.now() - this.start;
    timingVal.innerText = `${dur}ms`;
    this.counter += 1;

    if (updateImage && this.wasm && this.counter % 3 == 0)
      this.updateImage(this.wasm.imageSoFar());
  }

  updateImage(data) {
    ctx.putImageData(data, 0, 0);
  }

  stop() {
    if (!this.running)
      return;
    console.timeEnd('render');
    this.running = false;
    this.wasm = null;
    clearInterval(this.interval);
    button.disabled = false;
  }
}

function render(scene) {
  if (rendering) {
    rendering.stop();
    rendering = null;
  }
  rendering = new State(scene.render(parseInt(concurrency.value), pool));
}
