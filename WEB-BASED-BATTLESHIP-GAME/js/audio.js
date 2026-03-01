const sounds = {
    hit: document.getElementById('sfx-hit'),
    miss: document.getElementById('sfx-miss'),
    sink: document.getElementById('sfx-sink'),
    win: document.getElementById('sfx-win'),
    bgm: document.getElementById('bgm-ocean')
};



export const AudioController = {
    play(effectName) {
        const sound = document.getElementById(`sfx-${effectName}`);
        if (sound) {
            const temp = sound.cloneNode();
            temp.volume = sound.volume;
            temp.play();
        }
    },
    startBGM(effectName) {
        sounds.bgm.volume = 0.2;
        sounds.bgm.play();
    }
}