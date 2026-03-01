const sounds = {
    hit: document.getElementById('sfx-hit'),
    miss: document.getElementById('sfx-miss'),
    placingShip: document.getElementById('sfx-placingShip'),
    battlestart: document.getElementById('sfx-battlestart'),
    defeat: document.getElementById('sfx-defeat'),
    victory: document.getElementById('sfx-victory'),
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