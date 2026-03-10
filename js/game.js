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

let isPvP = false;
let currentPlayer = 1; 

const playerBoard = createBoatData();
const cpuBoard = createBoatData(); 

const statusText = document.getElementById('status-text');
const difficultySelect = document.getElementById('difficulty-select');
const startModal = document.getElementById('start-modal');
const gameModal = document.getElementById('game-modal');
const modalBtn = document.getElementById('modal-btn');
const mainGameArea = document.getElementById('main-game-area');

const btnSinglePlayer = document.getElementById('btn-single-player');
const btnLocalPvP = document.getElementById('btn-local-pvp');
const fogModal = document.getElementById('fog-of-war-modal');
const fogTitle = document.getElementById('fog-title');
const btnReady = document.getElementById('btn-ready');
const toggleFleetBtn = document.getElementById('toggle-fleet-btn');
const playerBoardDOM = document.getElementById('player-board');
const cpuBoardDOM = document.getElementById('cpu-board');
const shipDock = document.getElementById('ship-dock');

btnSinglePlayer.addEventListener('click', () => {
    isPvP = false;
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    
    // Logic: an nut tang hinh
    toggleFleetBtn.style.display = 'none'; 
    playerBoardDOM.classList.remove('fleet-hidden');
    cpuBoardDOM.classList.remove('fleet-hidden');

    AudioController.startBGM();
    statusText.innerText = "Status: Drag ships to your board!";
});

btnLocalPvP.addEventListener('click', () => {
    isPvP = true;
    currentPlayer = 1;
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    document.querySelector('.difficulty-group').style.display = 'none';
    
    // Logic: hien nut tang hinh khi PvP
    toggleFleetBtn.style.display = 'block'; 
    playerBoardDOM.classList.remove('fleet-hidden');
    cpuBoardDOM.classList.remove('fleet-hidden');

    statusText.innerText = "Player 1: Set up your fleet!";
    AudioController.startBGM();
});

modalBtn.onclick = () => {
    gameModal.style.display = 'none';
    location.reload(); 
};

function showFog(title) {
    fogTitle.innerText = title;
    fogModal.style.display = 'flex';
}

btnReady.addEventListener('click', () => {
    fogModal.style.display = 'none';
    
    //giau tau trong khi ban nhau
    if (shipDock.style.display === 'none') {
        playerBoardDOM.classList.add('fleet-hidden');
        cpuBoardDOM.classList.add('fleet-hidden');
        toggleFleetBtn.innerText = "👁️ Show Fleet";
        toggleFleetBtn.style.background = "white";
        toggleFleetBtn.style.color = "var(--accent-teal)";
    } else {
        playerBoardDOM.classList.remove('fleet-hidden');
        cpuBoardDOM.classList.remove('fleet-hidden');
    }
    
    if (isPvP && !isGameOver && shipDock.style.display !== 'none') {
        refreshSetupUI();
    }
});

toggleFleetBtn.addEventListener('click', () => {
    // an hien ca hai bang
    playerBoardDOM.classList.toggle('fleet-hidden');
    cpuBoardDOM.classList.toggle('fleet-hidden');
    
    if (playerBoardDOM.classList.contains('fleet-hidden')) {
        toggleFleetBtn.innerText = "👁️ Show Fleet";
        toggleFleetBtn.style.background = "white";
        toggleFleetBtn.style.color = "var(--accent-teal)";
    } else {
        toggleFleetBtn.innerText = "🙈 Hide Fleet";
        toggleFleetBtn.style.background = "var(--accent-teal)";
        toggleFleetBtn.style.color = "white";
    }
});

function handleHover(row, col) {
    if (draggedShipIndex === null || isGameOver) return;

    let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
    let activeBoard = (isPvP && currentPlayer === 2) ? cpuBoard : playerBoard;
    
    const ship = activeArmy[draggedShipIndex];
    let targetBoardId = (isPvP && currentPlayer === 2) ? '#cpu-board .cell' : '#player-board .cell';
    const cells = document.querySelectorAll(targetBoardId);
    
    cells.forEach(c => c.classList.remove('preview-valid', 'preview-invalid'));

    const isValid = isValidPlacement(activeBoard, ship.shipSize, row, col, currentDirection);
    
    for (let i = 0; i < ship.shipSize; i++) {
        const r = row + i * currentDirection.dy;
        const c = col + i * currentDirection.dx;
        if (r >= 0 && r < 10 && c >= 0 && c < 10) {
            cells[r * 10 + c].classList.add(isValid ? 'preview-valid' : 'preview-invalid');
        }
    }
}

function clearHover() {
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('preview-valid', 'preview-invalid');
    });
}

function initDragAndDrop() {
    const dockShips = document.querySelectorAll('.dock-ship');
    dockShips.forEach((shipEl) => {
        shipEl.addEventListener('dragstart', (e) => {
            draggedShipIndex = parseInt(e.target.dataset.index) || Array.from(dockShips).indexOf(e.target);
            e.dataTransfer.setData('shipIndex', draggedShipIndex);

            let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
            const ship = activeArmy[draggedShipIndex];
            
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

    let targetBoardId = (isPvP && currentPlayer === 2) ? '#cpu-board .cell' : '#player-board .cell';
    const cells = document.querySelectorAll(targetBoardId);
    
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
            
            let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
            let activeBoard = (isPvP && currentPlayer === 2) ? cpuBoard : playerBoard;
            const ship = activeArmy[shipIdx];

            if (!ship) return; 

            const success = placeShip({
                board: activeBoard,
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
    let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
    let activeBoard = (isPvP && currentPlayer === 2) ? cpuBoard : playerBoard;
    let targetDOM = (isPvP && currentPlayer === 2) ? 'cpu-board' : 'player-board';

    renderBoard(activeBoard, targetDOM, { pArmy: activeArmy });
    renderDock(activeArmy, currentDirection);
    initDragAndDrop();
    
    if (activeArmy.every(s => s.placed)) {
        if (!isPvP) {
            statusText.innerText = "Status: All ships deployed! Battle Start!";
            startBattle();
        } else {
            if (currentPlayer === 1) {
                currentPlayer = 2;
                statusText.innerText = "Player 2: Set up your fleet!";
                document.getElementById('player-board').parentElement.style.display = 'none';
                document.getElementById('cpu-board').parentElement.style.display = 'block';
                showFog("PLAYER 2 SETUP PHASE");
            } else {
                statusText.innerText = "Status: Battle Start!";
                startBattle();
            }
        }
    }
}

function startBattle() {
    AudioController.play('battlestart');
    shipDock.style.display = 'none';
    document.querySelector('.orientation-wrapper').style.display = 'none';
    
    document.getElementById('player-board').parentElement.style.display = 'block';
    document.getElementById('cpu-board').parentElement.style.display = 'block';

    if (!isPvP) {
        placeCPUShips(cpuBoard, cpuArmy); 
        renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack }); 
    } else {
        currentPlayer = 1; 
        
        // buoc an tau khi bat dau choi PvP
        playerBoardDOM.classList.add('fleet-hidden');
        cpuBoardDOM.classList.add('fleet-hidden');
        
        showFog("BATTLE START: PLAYER 1");
        renderBoard(playerBoard, 'player-board', { onCellClick: handleAttack });
        renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack });
    }
}

function handleAttack(row, col) {
    if (isGameOver || !canPlayerAttack) return;

    if (!isPvP) {
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
    else {
        let targetBoard = currentPlayer === 1 ? cpuBoard : playerBoard;
        let targetArmy = currentPlayer === 1 ? cpuArmy : playerArmy;
        let targetDOM = currentPlayer === 1 ? 'cpu-board' : 'player-board';

        const result = receiveAttack(targetBoard, row, col, targetArmy);
        if (result === "invalid") return; 

        if (result === "hit" || result === "sunk") AudioController.play('hit');
        else if (result === "miss") AudioController.play('miss');

        renderBoard(targetBoard, targetDOM, { onCellClick: handleAttack });

        if (defeated(targetArmy)) {
            isGameOver = true;
            canPlayerAttack = false;
            AudioController.stopBGM();
            AudioController.play('victory');
            showGameModal("VICTORY!", `PLAYER ${currentPlayer} WINS!`);
            return;
        }

        canPlayerAttack = false;
        statusText.innerText = "Status: Switching turns...";
        
        setTimeout(() => {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            showFog(`PLAYER ${currentPlayer}'S TURN`);
            
            let myBoard = currentPlayer === 1 ? playerBoard : cpuBoard;
            let myArmy = currentPlayer === 1 ? playerArmy : cpuArmy;
            let myDOM = currentPlayer === 1 ? 'player-board' : 'cpu-board';
            
            renderBoard(playerBoard, 'player-board', { onCellClick: handleAttack });
            renderBoard(cpuBoard, 'cpu-board', { onCellClick: handleAttack });
            renderBoard(myBoard, myDOM, { pArmy: myArmy, onCellClick: handleAttack });
            
            canPlayerAttack = true;
            statusText.innerText = `Player ${currentPlayer}: Attack!`;
        }, 800);
    }
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
    let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
    renderDock(activeArmy, currentDirection);
    initDragAndDrop();
};

document.getElementById('btn-vertical').onclick = (e) => {
    currentDirection = direction.VERTICAL;
    document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    let activeArmy = (isPvP && currentPlayer === 2) ? cpuArmy : playerArmy;
    renderDock(activeArmy, currentDirection);
    initDragAndDrop();
};

renderBoard(playerBoard, 'player-board');
renderDock(playerArmy, currentDirection);
initDragAndDrop();