window.loadWasmMultithread = async function () {
  await loadWasmBindgen();
  await loadWasm();
  const { Scene, WorkerPool } = wasm_bindgen;

  // The maximal concurrency of our web worker pool is `hardwareConcurrency`,
  // so set that up here and this ideally is the only location we create web
  // workers.
  const Pool = new WorkerPool(navigator.hardwareConcurrency);
  
  return { Scene, WorkerPool, Pool };
}

// First up, but try to do feature detection to provide better error messages
async function loadWasm() {
  let msg = 'This demo requires a recent enough browser with support for SharedArrayBuffer and passive wasm memory.';
  if (typeof SharedArrayBuffer !== 'function') {
    throw new Error('this browser does not have SharedArrayBuffer support enabled' + '\n\n' + msg);
  }
  // Test for bulk memory operations with passive data segments
  //  (module (memory 1) (data passive ""))
  const buf = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
    0x05, 0x03, 0x01, 0x00, 0x01, 0x0b, 0x03, 0x01, 0x01, 0x00]);
  if (!WebAssembly.validate(buf)) {
    throw new Error('this browser does not support passive wasm memory, demo does not work' + '\n\n' + msg);
  }

  try {
    await wasm_bindgen();
  } catch (e) {
    console.error(e);
  }
}

async function loadWasmBindgen() {
  await loadScript("wasm-multithread/pkg/wasm_multithread.js");
}

function loadScript(src) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.setAttribute('src', src);
    script.onload = function() { resolve(); };
    document.body.appendChild(script);
  });
}