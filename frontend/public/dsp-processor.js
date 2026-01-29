class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.engine = null;
    this.module = null;
    this.heapBuffer = null;
    this.port.onmessage = (e) => this.handleMessage(e.data);
  }

  async handleMessage(data) {
    // initialization
    if (data.type === "init") {
      importScripts("audio-engine.js");
      const module = await createAudioEngine();
      this.engine = new module.SineOscillator();
      this.engine.setSampleRate(sampleRate);
      this.module = module;
      this.port.postMessage({ type: "ready" });
    }
    // when ui sends play msg
    if (data.type === "play") {
      this.engine?.setPlaying(true);
    }
    // when ui sends stop msg
    if (data.type === "stop") {
      this.engine?.setPlaying(false);
    }
  }

  process(inputs, outputs, parameters) {
    // if engine or module missing, return but keep processor alive
    if (!this.engine || !this.module) return true;

    // set browser output first output bus, first channel on that bus (mono)
    // this is the audio buffer for the browser
    const output = outputs[0][0];
    // set numSamples to size of browser audio buffer
    const numSamples = output.length;

    // if buffer has not been allocated and is big enough
    // reserves contiguous spot of memory
    // float 32 is 4 bytes
    if (!this.heapBuffer || this.heapBuffer.length < numSamples) {
      if (this.heapBuffer) this.module._free(this.heapBuffer);
      this.heapBuffer = this.module._malloc(numSamples * 4);
    }

    // call wasm process function which puts result in wasm heap memory
    this.engine.process(this.heapBuffer, numSamples);

    // pull audio from wasm private memory so it can be played in browser
    const wasmOutput = new Float32Array(
      this.module.HEAPF32.buffer,
      this.heapBuffer,
      numSamples
    );
    output.set(wasmOutput);

    // call me again when the next block of samples is need
    return true;
  }
}

registerProcessor("dsp-processor", DSPProcessor);
