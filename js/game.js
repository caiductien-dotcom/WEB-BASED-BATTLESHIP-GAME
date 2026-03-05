import { createBoatData, placeShip, receiveAttack, defeated, isValidPlacement } from "./board.js";
import { renderBoard, renderDock } from "./ui.js"; 
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack, hardBotAttack, memoryReset } from "./ai.js";
import { AudioController } from "./audio.js";

let currentDirection = direction.HORIZONTAL;
const playerArmy = playerShipArmy();
const cpuArmy = playerShipArmy();
let isGameOver = false;
let canPlayerAttack = true; 
let draggedShipIndex = null;

const playerBoard = createBoatData();
const cpuBoard = createBoatData(); 

const statusText = document.getElementById('status-text');
const difficultySelect = document.getElementById('difficulty-select');
const startModal = document.getElementById('start-modal');
const modalStartBtn = document.getElementById('modal-start-btn');
const gameModal = document.getElementById('game-modal');
const modalBtn = document.getElementById('modal-btn');
const mainGameArea = document.getElementById('main-game-area');

modalStartBtn.addEventListener('click', () => {
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    AudioController.startBGM();
    statusText.innerText = "Status: Drag ships to your board!";
});

modalBtn.onclick = () => {
    gameModal.style.display = 'none';
};

function handleHover(row, col) {
    if (draggedShipIndex === null || isGameOver) return;

    const ship = playerArmy[draggedShipIndex];
    const cells = document.querySelectorAll('#player-board .cell');
    cells.forEach(c => c.classList.remove('preview-valid', 'preview-invalid'));

    const isValid = isValidPlacement(playerBoard, ship.shipSize, row, col, currentDirection);
    
    for (let i = 0; i < ship.shipSize; i++) {
        const r = row + i * currentDirection.dy;
        const c = col + i * currentDirection.dx;
        if (r >= 0 && r < 10 && c >= 0 && c < 10) {
            cells[r * 10 + c].classList.add(isValid ? 'preview-valid' : 'preview-invalid');
        }
    }
}

function clearHover() {
    document.querySelectorAll('#player-board .cell').forEach(c => {
        c.classList.remove('preview-valid', 'preview-invalid');
    });
}

function initDragAndDrop() {
    const dockShips = document.querySelectorAll('.dock-ship');
    dockShips.forEach((shipEl) => {
        shipEl.addEventListener('dragstart', (e) => {
            draggedShipIndex = e.target.getAttribute('data-index') || Array.from(dockShips).indexOf(e.target);
            e.dataTransfer.setData('shipIndex', draggedShipIndex);

            const ship = playerArmy[draggedShipIndex];
            const ghost = document.createElement('div');
            ghost.style.position = 'absolute';
            ghost.style.top = '-1000px';

            if (currentDirection === direction.VERTICAL) {
                ghost.style.width = '40px';
                ghost.style.height = `${ship.shipSize * 40}px`;
                
                const inner = document.createElement('div');
                inner.style.width = `${ship.shipSize * 40}px`;
                inner.style.height = '40px';
                inner.style.backgroundImage = window.getComputedStyle(e.target).backgroundImage;
                inner.style.backgroundSize = '100% 100%';
                inner.style.backgroundRepeat = 'no-repeat';
                inner.style.transform = 'rotate(90deg)';
                inner.style.transformOrigin = 'top left';
                inner.style.position = 'absolute';
                inner.style.left = '40px';
                
                ghost.appendChild(inner);
            } else {
                ghost.style.width = `${ship.shipSize * 40}px`;
                ghost.style.height = '40px';
                ghost.style.backgroundImage = window.getComputedStyle(e.target).backgroundImage;
                ghost.style.backgroundSize = '100% 100%';
                ghost.style.backgroundRepeat = 'no-repeat';
            }

            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 20, 20);
            setTimeout(() => document.body.removeChild(ghost), 0);
        });
    });

    const cells = document.querySelectorAll('#player-board .cell');
    cells.forEach((cell, index) => {
        const r = Math.floor(index / 10);
        const c = index % 10;

        cell.ondragover = (e) => {
            e.preventDefault();
            handleHover(r, c);
        };

        cell.ondragleave = () => {
            clearHover();
        };

        cell.ondrop = (e) => {
            e.preventDefault();
            clearHover();
            
            const shipIdx = parseInt(e.dataTransfer.getData('shipIndex'));
            const ship = playerArmy[shipIdx];

            if (!ship) return; 

            const success = placeShip({
                board: playerBoard,
                ship: ship,
                row: r,
                col: c,
                dirVector: currentDirection
            });

            if (success) {
                AudioController.play('placingShip');
                draggedShipIndex = null;
                refreshSetupUI();
            }
        };
    });
}
function refreshSetupUI() {
    renderBoard(playerBoard, 'player-board', { pArmy: playerArmy });
    renderDock(playerArmy, currentDirection);
    initDragAndDrop();
    
    if (playerArmy.every(s => s.placed)) {
        statusText.innerText = "Status: All ships deployed! Battle Start!";
        startBattle();
    }
}

function startBattle() {
    AudioController.play('battlestart');
    placeCPUShips(cpuBoard, cpuArmy); 
    renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack }); 
    document.getElementById('ship-dock').style.display = 'none';
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
        AudioController.stopBGM();
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
            AudioController.stopBGM();
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
    renderDock(playerArmy, currentDirection);
    initDragAndDrop();
};

document.getElementById('btn-vertical').onclick = (e) => {
    currentDirection = direction.VERTICAL;
    document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderDock(playerArmy, currentDirection);
    initDragAndDrop();
};

renderBoard(playerBoard, 'player-board');
renderDock(playerArmy, currentDirection);
initDragAndDrop();