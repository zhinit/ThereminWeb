#include <cmath>
#include <cstdint>
#include <emscripten/bind.h>

class SineOscillator {
public:
    void setPlaying(bool playing) { playing_ = playing; }
    void setFreq(float freq) { freq_ = freq; }
    void setSampleRate (float sampleRate) { sampleRate_ = sampleRate; }

    void process(uintptr_t outputPtr, int numSamples) {
        float* output = reinterpret_cast<float*>(outputPtr);
        float phaseInc = freq_ / sampleRate_;

        for (int i = 0; i < numSamples; i++) {
            if (playing_) {
                output[i] = std::sin(phase_ * 2.0f * M_PI) * 0.3f;
                phase_ += phaseInc;
                if (phase_ >= 1.0f) phase_ -= 1.0f;
            } else {
                output[i] = 0.0f;
            }
        }
    }

private:
    float phase_ = 0.0f;
    float freq_ = 440.0f;
    float sampleRate_ = 44100.0f;
    bool playing_ = false;
};

EMSCRIPTEN_BINDINGS(audio_module) {
    emscripten::class_<SineOscillator>("SineOscillator")
        .constructor()
        .function("setPlaying", &SineOscillator::setPlaying)
        .function("setFreq", &SineOscillator::setFreq)
        .function("setSampleRate", &SineOscillator::setSampleRate)
        .function("process", &SineOscillator::process);
}