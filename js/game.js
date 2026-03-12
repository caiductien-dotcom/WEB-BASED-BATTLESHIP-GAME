import { createBoatData, placeShip, receiveAttack, defeated, isValidPlacement } from "./board.js";
import { renderBoard, renderDock } from "./ui.js"; 
import { board_size, direction, phase } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack, hardBotAttack, memoryReset } from "./ai.js";
import { AudioController } from "./audio.js";

const G_STATE = {
    players: {
        1: { 
            board: createBoatData(), 
            army: playerShipArmy(), 
            boardDOM: document.getElementById('player-board') 
        },
        2: { 
            board: createBoatData(), 
            army: playerShipArmy(), 
            boardDOM: document.getElementById('cpu-board') 
        }
    },
    phase: phase.SETUP,
    currentPlayer: 1
};

let currentDirection = direction.HORIZONTAL;
let isGameOver = false;
let canPlayerAttack = true; 
let draggedShipIndex = null;
let isPvP = false;

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
const shipDock = document.getElementById('ship-dock');

btnSinglePlayer.addEventListener('click', () => {
    isPvP = false;
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    
    // Logic: an nut tang hinh
    toggleFleetBtn.style.display = 'none'; 
    G_STATE.players[1].boardDOM.classList.remove('fleet-hidden');
    G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');

    AudioController.startBGM();
    statusText.innerText = "Status: Drag ships to your board!";
});

btnLocalPvP.addEventListener('click', () => {
    isPvP = true;
    G_STATE.currentPlayer = 1;
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    document.querySelector('.difficulty-group').style.display = 'none';
    
    // Logic: hien nut tang hinh khi PvP
    toggleFleetBtn.style.display = 'block'; 
    G_STATE.players[1].boardDOM.classList.remove('fleet-hidden');
    G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');

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
        G_STATE.players[1].boardDOM.classList.add('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.add('fleet-hidden');
        toggleFleetBtn.innerText = "👁️ Show Fleet";
        toggleFleetBtn.style.background = "white";
        toggleFleetBtn.style.color = "var(--accent-teal)";
    } else {
        G_STATE.players[1].boardDOM.classList.remove('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');
    }
    
    if (isPvP && !isGameOver && shipDock.style.display !== 'none') {
        refreshSetupUI();
    }
});

toggleFleetBtn.addEventListener('click', () => {
    // an hien ca hai bang
    G_STATE.players[1].boardDOM.classList.toggle('fleet-hidden');
    G_STATE.players[2].boardDOM.classList.toggle('fleet-hidden');
    
    if (G_STATE.players[1].boardDOM.classList.contains('fleet-hidden')) {
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

    const pData = G_STATE.players[G_STATE.currentPlayer];
    const ship = pData.army[draggedShipIndex];
    
    const targetBoardId = (G_STATE.currentPlayer === 1) ? '#player-board .cell' : '#cpu-board .cell';    
    const cells = document.querySelectorAll(targetBoardId);
    
    cells.forEach(c => c.classList.remove('preview-valid', 'preview-invalid'));

    const isValid = isValidPlacement(pData.board, ship.shipSize, row, col, currentDirection);
    
    for (let i = 0; i < ship.shipSize; i++) {
        const r = row + i * currentDirection.dy;
        const c = col + i * currentDirection.dx;
        if (r >= board_size && r < board_size && c >= 0 && c < board_size) {
            cells[r * board_size + c].classList.add(isValid ? 'preview-valid' : 'preview-invalid');
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

            let activeArmy = (G_STATE.currentPlayer === 2) ? G_STATE.players[2].army : G_STATE.players[1].army;
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

    const pData = G_STATE.players[G_STATE.currentPlayer];
    console.log("Đang khởi tạo cho Player:", G_STATE.currentPlayer);
    console.log("Board DOM:", pData.boardDOM);
    const cells = pData.boardDOM.querySelectorAll('.cell');
    

    cells.forEach((cell) => {
        cell.onmouseover = null;
        cell.ondragover = null;
        cell.ondrop = null;
    });
    
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

            const activePlayer = G_STATE.players[G_STATE.currentPlayer];
            const ship = activePlayer.army[shipIdx];

            if (!ship) return;

            const success = placeShip({
                board: activePlayer.board,
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
    const pData = G_STATE.players[G_STATE.currentPlayer];
    
    renderBoard(pData.board, pData.boardDOM.id, { pArmy: pData.army });
    renderDock(pData.army, currentDirection);

    initDragAndDrop();
    
    if (pData.army.every(s => s.placed)) {
        if (isPvP && G_STATE.currentPlayer === 1) {
            G_STATE.currentPlayer = 2;
            G_STATE.players[1].boardDOM.parentElement.style.display = 'none';
            G_STATE.players[2].boardDOM.parentElement.style.display = 'block';
            showFog("PLAYER 2 SETUP PHASE");
        } else {
            G_STATE.phase = phase.BATTLE;
            startBattle();
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
        placeCPUShips(G_STATE.players[2].board, G_STATE.players[2].army); 
        renderBoard(G_STATE.players[2].board, 'cpu-board', { onCellClick: handleAttack });
    } else {
        G_STATE.currentPlayer = 1;
        
        // buoc an tau khi bat dau choi PvP
        G_STATE.players[1].boardDOM.classList.add('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.add('fleet-hidden');
        
        showFog("BATTLE START: PLAYER 1");
        renderBoard(G_STATE.players[1].board, 'player-board', { onCellClick: handleAttack });
        renderBoard(G_STATE.players[2].board, 'cpu-board', { onCellClick: handleAttack });
    }
}

function handleAttack(row, col) {
    if (isGameOver || !canPlayerAttack) return;

    const opponentId = G_STATE.currentPlayer === 1 ? 2 : 1;
    const opponent = G_STATE.players[opponentId];

    const result = receiveAttack(opponent.board, row, col, opponent.army);
    if (result === "invalid") return; 

    if (result === "hit" || result === "sunk") AudioController.play('hit');
    else if (result === "miss") AudioController.play('miss');

    renderBoard(opponent.board, opponent.boardDOM.id, { onCellClick: handleAttack });

    if (defeated(opponent.army)) {
        isGameOver = true;
        AudioController.play('victory');
        showGameModal("VICTORY!", `PLAYER ${G_STATE.currentPlayer} WINS!`);
        return;
    }
    canPlayerAttack = false;
    if (isPvP) {
        setTimeout(() => {
            G_STATE.currentPlayer = opponentId;
            showFog(`PLAYER ${G_STATE.currentPlayer}'S TURN`);
            canPlayerAttack = true;
        }, 800);
    } 
    else {
        statusText.innerText = "Status: Enemy is calculating...";
        
        setTimeout(() => {
            if (isGameOver) return;

            let botResult;
            if (difficultySelect.value === 'hard') {
                botResult = hardBotAttack(G_STATE.players[1].board, G_STATE.players[1].army);
            } else {
                botResult = easyBotAttack(G_STATE.players[1].board, G_STATE.players[1].army);
            }

            if (botResult === "hit" || botResult === "sunk") {
                AudioController.play('hit');
            } else if (botResult === "miss") {
                AudioController.play('miss');
            }

            renderBoard(G_STATE.players[1].board, 'player-board', { pArmy: G_STATE.players[1].army });

            if (defeated(G_STATE.players[1].army)) {
                isGameOver = true;
                AudioController.stopBGM();
                AudioController.play('defeat');
                showGameModal("DEFEAT!", "Your entire fleet has been sunk!");
                return;
            }

            canPlayerAttack = true;
            statusText.innerText = "Status: Your turn! Attack!";
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
    let activeArmy = G_STATE.players[G_STATE.currentPlayer].army;
    renderDock(activeArmy, currentDirection);
    initDragAndDrop();
};

document.getElementById('btn-vertical').onclick = (e) => {
    currentDirection = direction.VERTICAL;
    document.querySelectorAll('.button-group button').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    let activeArmy = G_STATE.players[G_STATE.currentPlayer].army;
    renderDock(activeArmy, currentDirection);
    initDragAndDrop();
};

renderBoard(G_STATE.players[1].board, 'player-board');
renderDock(G_STATE.players[1].army, currentDirection);
initDragAndDrop();