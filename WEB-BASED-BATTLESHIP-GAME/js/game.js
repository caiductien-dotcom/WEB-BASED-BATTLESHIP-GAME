import { createBoatData, placeShip, receiveAttack, defeated } from "./board.js";
import { renderBoard } from "./ui.js"; 
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack, hardBotAttack, memoryReset } from "./ai.js";
import { AudioController } from "./audio.js";

let currentDirection = direction.HORIZONTAL;
const playerArmy = playerShipArmy();
const cpuArmy = playerShipArmy();
let shipIndex = 0;
let isGameOver = false;
let canPlayerAttack = true; 

const playerBoard = createBoatData();
const cpuBoard = createBoatData(); 

const statusText = document.getElementById('status-text');
const difficultySelect = document.getElementById('difficulty-select');
const startModal = document.getElementById('start-modal');
const modalStartBtn = document.getElementById('modal-start-btn');
const gameModal = document.getElementById('game-modal');
const modalBtn = document.getElementById('modal-btn');

modalStartBtn.addEventListener('click', () => {
    startModal.style.display = 'none';
    AudioController.startBGM();
    statusText.innerText = "Status: Fleet ready! Click to place your ships.";
});

modalBtn.onclick = () => {
    gameModal.style.display = 'none';
};

function handlePlacement(row, col) {
    if (shipIndex >= playerArmy.length || isGameOver) return;
    const success = placeShip({ 
        board: playerBoard, 
        ship: playerArmy[shipIndex], 
        row, 
        col, 
        dirVector: currentDirection 
    });

    if (success) {
        shipIndex++;
        renderBoard(playerBoard, 'player-board', { onCellClick: handlePlacement, pArmy: playerArmy });
        if (shipIndex === playerArmy.length) {
            statusText.innerText = "Battle Start! Fire at the enemy!";
            startBattle();
        } else {
            statusText.innerText = `Placing: ${playerArmy[shipIndex].shipName}`;
        }
    }
}

function startBattle() {
    placeCPUShips(cpuBoard, cpuArmy); 
    renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack }); 
}

function handleAttack(row, col) {
    if (isGameOver || !canPlayerAttack) return;

    const result = receiveAttack(cpuBoard, row, col, cpuArmy);
    if (result === "invalid") return; 

    if (result === "hit" || result === "sunk") AudioController.play('hit');
    else if (result === "miss") AudioController.play('miss');

    renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack }); 

    if (defeated(cpuArmy)) {
        isGameOver = true;
        canPlayerAttack = false;
        AudioController.play('victory');
        showGameModal("VICTORY!", "All enemy ships have been destroyed!");
        memoryReset();
        return;
    }

    canPlayerAttack = false;
    statusText.innerText = "Status: Enemy is calculating...";

    setTimeout(() => {
        if (isGameOver) return;

        let botResult;
        if (difficultySelect.value === 'hard') {
            botResult = hardBotAttack(playerBoard, playerArmy);
        } else {
            botResult = easyBotAttack(playerBoard, playerArmy);
        }

        if (botResult === "hit" || botResult === "sunk") AudioController.play('hit');
        else if (botResult === "miss") AudioController.play('miss');

        renderBoard(playerBoard, 'player-board', { pArmy: playerArmy });

        if (defeated(playerArmy)) {
            isGameOver = true;
            canPlayerAttack = false;
            AudioController.play('defeat');
            showGameModal("DEFEAT!", "Your entire fleet has been sunk!");
        } else {
            canPlayerAttack = true;
            statusText.innerText = "Status: Your turn! Attack!";
        }
    }, 600);
}

function showGameModal(title, message) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = message;
    gameModal.style.display = 'flex';
}

document.getElementById('btn-horizontal').onclick = (e) => {
    currentDirection = direction.HORIZONTAL;
    document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
};

document.getElementById('btn-vertical').onclick = (e) => {
    currentDirection = direction.VERTICAL;
    document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
};

renderBoard(playerBoard, 'player-board', { onCellClick: handlePlacement, pArmy: playerArmy });
renderBoard(cpuBoard, 'cpu-board');