import { createBoatData, placeShip, receiveAttack, defeated } from "./board.js";
import { renderBoard } from "./ui.js"; 
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack, hardBotAttack, memoryReset } from "./ai.js";
import { AudioController } from "./audio.js";

let currentDirection = direction.HORIZONTAL;
const pArmy = playerShipArmy();
const cArmy = playerShipArmy();
let shipIndex = 0;
let isGameOver = false;

const pBoard = createBoatData();
const cBoard = createBoatData(); 
const modalBtn = document.getElementById('modal-btn');

modalBtn.addEventListener('click', () => {
    document.getElementById('game-modal').classList.remove('active');
    
    AudioController.startBGM();
    
    statusText.innerText = "Status: Your turn! Attack the enemy.";
});

const statusText = document.getElementById('status-text');
const diffSelect = document.getElementById('difficulty-select');

function handlePlacement(row, col) {
    if (shipIndex >= pArmy.length || isGameOver) return;
    const success = placeShip({ board: pBoard, ship: pArmy[shipIndex], row, col, dirVector: currentDirection });

    if (success) {
        shipIndex++;
        renderBoard(pBoard, 'player-board', { onCellClick: handlePlacement, pArmy });
        if (shipIndex === pArmy.length) {
            statusText.innerText = "Battle Start! Fire at the enemy!";
            startBattle();
        } else {
            statusText.innerText = `Placing: ${pArmy[shipIndex].shipName}`;
        }
    }
}

function startBattle() {
    placeCPUShips(cBoard, cArmy); 
    renderBoard(cBoard, 'cpu-board', { onCellClick: handleAttack }); 
}

function handleAttack(row, col) {
    if (isGameOver) return;
    const result = receiveAttack(cBoard, row, col, cArmy);
    if (result === "invalid") return; 

    if (result === "hit"){
        AudioController.play('hit');
    }
    else if (result === "miss"){
        AudioController.play('miss');
    }

    renderBoard(cBoard, 'cpu-board', { onCellClick: handleAttack }); 

    if (defeated(cArmy)) {
        AudioController.play('victory');
        alert("VICTORY!");
        isGameOver = true;
        memoryReset();
    } else {

        setTimeout(() => {
            let botResult;
            if (diffSelect.value === 'hard') botResult =  hardBotAttack(pBoard, pArmy);
            else botResult = easyBotAttack(pBoard, pArmy);

            if (botResult === "hit") AudioController.play('hit');
            else if (botResult === "miss") AudioController.play('miss');

            renderBoard(pBoard, 'player-board', { pArmy });
            if (defeated(pArmy)){
                AudioController.play('defeat')
                alert("DEFEAT!");
            };
        }, 600);
    }
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

renderBoard(pBoard, 'player-board', { onCellClick: handlePlacement, pArmy });
renderBoard(cBoard, 'cpu-board');