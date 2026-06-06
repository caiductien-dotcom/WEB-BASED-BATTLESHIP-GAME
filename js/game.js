import { createBoatData, placeShip, receiveAttack, defeated, isValidPlacement } from "./board.js";
import { renderBoard, renderDock } from "./ui.js";
import { board_size, direction, phase } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack, hardBotAttack, memoryReset } from "./ai.js";
import { AudioController } from "./audio.js";
import { BASE_URL } from "./utils.js";

// Them o dau file, sau cac import
async function loadUserInfo() {
    const token = localStorage.getItem("userToken");
    if (!token) return;

    try {
        const res = await fetch(`${BASE_URL}/api/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            // Hien ten user goc tren trai
            const nameEl = document.getElementById('user-name-display');
            const scoreEl = document.getElementById('user-score-display');
            if (nameEl) nameEl.innerText = `👤 ${data.name}`;
            if (scoreEl) scoreEl.innerText = `⭐ ${data.score} pts`;
        }
    } catch (err) {
        console.error("Failed to load user info:", err);
    }
}

loadUserInfo(); // Goi ngay khi game.js chay
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
    currentPlayer: 1,
    locked: { 1: false, 2: false }
};

let currentDirection = direction.HORIZONTAL;
let isGameOver = false;
let canPlayerAttack = true;
let draggedShipIndex = null;
let isPvP = false;
let activeSetupPlayer = 1; // player nao dang duoc dat tau

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
    activeSetupPlayer = 1;
    startModal.style.display = 'none';
    mainGameArea.style.display = 'flex';
    document.querySelector('.difficulty-group').style.display = 'none';

    // Logic: an nut tang hinh khi P1 dang setup
    toggleFleetBtn.style.display = 'block';
    G_STATE.players[1].boardDOM.classList.remove('fleet-hidden');
    G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');

    // P1 setup truoc: hien random P1, an random P2
    document.getElementById('btn-random-p1').style.display = 'block';
    document.getElementById('btn-lock-p2').style.display = 'block';

    // Render ca 2 board ngay tu dau
    renderBoard(G_STATE.players[1].board, 'player-board', {
        pArmy: G_STATE.players[1].army,
        onShipDragStart: (idx) => { draggedShipIndex = idx; },
        onShipDragEnd: () => { draggedShipIndex = null; clearHover(); }
    });
    renderBoard(G_STATE.players[2].board, 'cpu-board', { pArmy: G_STATE.players[2].army });
    renderDock(G_STATE.players[1].army, currentDirection);
    initDragAndDrop();

    statusText.innerText = "🎯 Player 1: Set up your fleet first!";
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

    if (G_STATE.phase === phase.BATTLE) {
        G_STATE.players[1].boardDOM.classList.add('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.add('fleet-hidden');

        toggleFleetBtn.innerText = "👁️ Show Fleet";
        toggleFleetBtn.style.background = "white";
        toggleFleetBtn.style.color = "var(--accent-teal)";
        statusText.innerText = `Player ${G_STATE.currentPlayer}'s Turn: Attack!`;
    } else {
        G_STATE.players[1].boardDOM.classList.remove('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');
    }
});

// AN/HIEN TAU (PvP)
toggleFleetBtn.addEventListener('click', () => {
    const targetPlayer = (G_STATE.phase === phase.BATTLE)
        ? G_STATE.currentPlayer
        : activeSetupPlayer;

    const myBoardDOM = G_STATE.players[targetPlayer].boardDOM;
    myBoardDOM.classList.toggle('fleet-hidden');

    const isHidden = myBoardDOM.classList.contains('fleet-hidden');
    toggleFleetBtn.innerText = isHidden ? "👁️ Show Fleet" : "🙈 Hide Fleet";
    toggleFleetBtn.style.background = isHidden ? "white" : "var(--accent-teal)";
    toggleFleetBtn.style.color = isHidden ? "var(--accent-teal)" : "white";
});
function clearHover() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('preview-valid', 'preview-invalid'));
}

// xu li hover khi keo tau
function handleHover(row, col) {
    if (draggedShipIndex === null || isGameOver) return;

    const pData = G_STATE.players[G_STATE.currentPlayer];
    const ship = pData.army[draggedShipIndex];
    if (!ship) return;

    const targetBoardId = (G_STATE.currentPlayer === 1) ? '#player-board .cell' : '#cpu-board .cell';
    const cells = document.querySelectorAll(targetBoardId);

    cells.forEach(c => c.classList.remove('preview-valid', 'preview-invalid'));
    const isValid = isValidPlacement(pData.board, ship.shipSize, row, col, currentDirection);

    for (let i = 0; i < ship.shipSize; i++) {
        const r = row + i * currentDirection.dy;
        const c = col + i * currentDirection.dx;
        if (r >= 0 && r < board_size && c >= 0 && c < board_size) {
            cells[r * board_size + c].classList.add(isValid ? 'preview-valid' : 'preview-invalid');
        }
    }
}

//  KHOI TAO KEO THA TAU
function initDragAndDrop() {
    const dockShips = document.querySelectorAll('.dock-ship');
    dockShips.forEach((shipEl) => {
        shipEl.addEventListener('dragstart', (e) => {
            draggedShipIndex = parseInt(e.target.dataset.index);
            e.dataTransfer.setData('shipIndex', draggedShipIndex);

            const ship = G_STATE.players[G_STATE.currentPlayer].army[draggedShipIndex];
            const ghost = document.createElement('div');
            ghost.style.position = 'absolute'; ghost.style.top = '-1000px';

            if (currentDirection === direction.VERTICAL) {
                ghost.style.width = '40px'; ghost.style.height = `${ship.shipSize * 40}px`;
                const inner = document.createElement('div');
                inner.style.width = `${ship.shipSize * 40}px`; inner.style.height = '40px';
                inner.style.backgroundImage = window.getComputedStyle(e.target).backgroundImage;
                inner.style.backgroundSize = '100% 100%'; inner.style.transform = 'rotate(90deg)';
                inner.style.transformOrigin = 'top left'; inner.style.position = 'absolute'; inner.style.left = '40px';
                ghost.appendChild(inner);
            } else {
                ghost.style.width = `${ship.shipSize * 40}px`; ghost.style.height = '40px';
                ghost.style.backgroundImage = window.getComputedStyle(e.target).backgroundImage;
                ghost.style.backgroundSize = '100% 100%';
            }
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 20, 20);
            setTimeout(() => document.body.removeChild(ghost), 0);
        });

        // Reset neu khong drop thanh cong
        shipEl.addEventListener('dragend', () => {
            draggedShipIndex = null;
            clearHover();
        });
    });

    const pData = G_STATE.players[G_STATE.currentPlayer];
    const cells = pData.boardDOM.querySelectorAll('.cell');

    cells.forEach((cell, index) => {
        const r = Math.floor(index / 10);
        const c = index % 10;

        cell.ondragover = (e) => {
            e.preventDefault();

            // Lay draggedShipIndex tu ship-display dang duoc keo 
            if (draggedShipIndex === null) {
                const draggingEl = document.querySelector('.ship-display[style*="opacity: 0.3"]');
                if (draggingEl) draggedShipIndex = parseInt(draggingEl.dataset.index);
            }

            const ship = draggedShipIndex !== null ? pData.army[draggedShipIndex] : null;
            if (ship && ship.position) {
                ship.position.forEach(p => { pData.board[p.row][p.col] = 0; });
            }

            handleHover(r, c);

            // Phuc hoi lai vi tri cu 
            if (ship && ship.position) {
                ship.position.forEach(p => { pData.board[p.row][p.col] = ship.shipName.toLowerCase(); });
            }
        };

        cell.ondragleave = () => clearHover();

        cell.ondrop = (e) => {
            e.preventDefault(); clearHover();

            // Kiem tra board nay co phai cua activeSetupPlayer khong
            const boardOwner = (pData.boardDOM.id === 'player-board') ? 1 : 2;
            if (isPvP && boardOwner !== activeSetupPlayer) return;

            const shipIdx = parseInt(e.dataTransfer.getData('shipIndex'));
            const ship = pData.army[shipIdx];
            if (!ship) return;

            const success = placeShip({ board: pData.board, ship, row: r, col: c, dirVector: currentDirection });
            if (success) {
                AudioController.play('placingShip');
                draggedShipIndex = null; // reset sau khi dat xong
                refreshSetupUI();
            }
        };
    });
}
// setup lai UI sau moi lan dat tau 
function refreshSetupUI() {
    const pData = G_STATE.players[G_STATE.currentPlayer];
    renderBoard(pData.board, pData.boardDOM.id, {
        pArmy: pData.army,
        onShipDragStart: (idx) => { draggedShipIndex = idx; },
        onShipDragEnd: () => { draggedShipIndex = null; clearHover(); }
    });
    renderDock(pData.army, currentDirection);
    initDragAndDrop();
}

// BAN NHAU
function startBattle() {
    AudioController.play('battlestart');
    if (!isPvP) toggleFleetBtn.style.display = 'none';
    shipDock.style.display = 'none';
    document.querySelector('.orientation-wrapper').style.display = 'none';
    document.querySelector('.setup-section').style.display = 'none';
    G_STATE.players[1].boardDOM.parentElement.style.display = 'block';
    G_STATE.players[2].boardDOM.parentElement.style.display = 'block';

    if (!isPvP) {
        placeCPUShips(G_STATE.players[2].board, G_STATE.players[2].army);
        renderBoard(G_STATE.players[2].board, 'cpu-board', { onCellClick: handleAttack });
    } else {
        G_STATE.currentPlayer = 1;
        // an tau doi thu khi moi bat dau
        G_STATE.players[1].boardDOM.classList.add('fleet-hidden');
        G_STATE.players[2].boardDOM.classList.add('fleet-hidden');
        showFog("BATTLE START: PLAYER 1");
        renderBoard(G_STATE.players[1].board, 'player-board', { pArmy: G_STATE.players[1].army });
        renderBoard(G_STATE.players[2].board, 'cpu-board', { onCellClick: handleAttack });
    }
}

//random tau
function randomPlaceAllShips(playerNum) {
    if (G_STATE.locked[playerNum]) return;
    if (isPvP && playerNum !== activeSetupPlayer) {
        statusText.innerText = `⛔ It's Player ${activeSetupPlayer}'s turn to set up!`;
        return;
    }
    const pData = G_STATE.players[playerNum];
    pData.board = createBoatData();
    pData.army = playerShipArmy();
    placeCPUShips(pData.board, pData.army);
    AudioController.play('placingShip');
    draggedShipIndex = null; // reset sau khi random
    clearHover();
    G_STATE.currentPlayer = playerNum;
    refreshSetupUI();
}

document.getElementById('btn-random-p1').addEventListener('click', () => randomPlaceAllShips(activeSetupPlayer));

function lockFleet(playerNum) {
    // khong phai luot cua ban
    if (isPvP && playerNum !== activeSetupPlayer) {
        statusText.innerText = `⛔ It's Player ${activeSetupPlayer}'s turn to set up!`;
        return;
    }

    const pData = G_STATE.players[playerNum];

    // chua dat het tau khong dc lock
    if (!pData.army.every(s => s.placed)) {
        statusText.innerText = `⚠️ Player ${playerNum}: Place all ships first!`;
        return;
    }

    G_STATE.locked[playerNum] = true;

    // disable nut random va lock
    if (isPvP && !G_STATE.locked[2]) {
        // P1 vua lock player chua -> re-enable random cho P2
        document.getElementById('btn-random-p1').disabled = false;
    } else {
        document.getElementById('btn-random-p1').disabled = true;
    }
    document.getElementById(`btn-lock-p${playerNum}`).innerText = "✅ Locked";
    document.getElementById(`btn-lock-p${playerNum}`).disabled = true;

    // ca 2 lock thi vao tran
    if (isPvP) {
        if (G_STATE.locked[1] && G_STATE.locked[2]) {
            G_STATE.phase = phase.BATTLE;
            startBattle();
        } else {
            // Player 1 da lock, chuyen luot sang player 2
            activeSetupPlayer = 2;
            G_STATE.currentPlayer = 2;
            draggedShipIndex = null;
            clearHover();

            G_STATE.players[1].boardDOM.classList.add('fleet-hidden');
            G_STATE.players[2].boardDOM.classList.remove('fleet-hidden');
            statusText.innerText = "✅ Player 1 locked! 🎯 Player 2: Set up your fleet!";
            renderBoard(G_STATE.players[2].board, 'cpu-board', {
                pArmy: G_STATE.players[2].army,
                onShipDragStart: (idx) => { draggedShipIndex = idx; },
                onShipDragEnd: () => { draggedShipIndex = null; clearHover(); }
            });
            renderDock(G_STATE.players[2].army, currentDirection);
            initDragAndDrop();
        }
    } else {
        G_STATE.phase = phase.BATTLE;
        startBattle();
    }
}

document.getElementById('btn-lock-p1').addEventListener('click', () => lockFleet(1));
document.getElementById('btn-lock-p2').addEventListener('click', () => lockFleet(2));

//Logic tan cong
async function handleAttack(row, col) {
    if (isGameOver || !canPlayerAttack) return;

    const opponentId = G_STATE.currentPlayer === 1 ? 2 : 1;
    const opponent = G_STATE.players[opponentId];

    const result = receiveAttack(opponent.board, row, col, opponent.army);
    if (result === "invalid") return;

    if (result === "hit" || result === "sunk") AudioController.play('hit');
    else if (result === "miss") AudioController.play('miss');

    // ve lai bang doi thu de hien ket qua ban
    renderBoard(opponent.board, opponent.boardDOM.id, {
        onCellClick: handleAttack,
        shotClass: `p${G_STATE.currentPlayer}-shot`
    });

    // kiem tra thang thua
    if (defeated(opponent.army)) {
        isGameOver = true;
        AudioController.play('victory');

        // Cong diem khi thang AI (single player)
        if (!isPvP) {
            const mode = difficultySelect.value; // "easy" hoac "hard"
            await submitScore(mode); // cho submit score roi moi show modal
        }

        showGameModal("VICTORY!", `PLAYER ${G_STATE.currentPlayer} WINS!`);
        return;
    }

    canPlayerAttack = false;

    if (isPvP) {
        setTimeout(() => {
            G_STATE.currentPlayer = opponentId;
            showFog(`PLAYER ${G_STATE.currentPlayer}'S TURN`);

            const myData = G_STATE.players[G_STATE.currentPlayer];
            const opData = G_STATE.players[opponentId === 1 ? 2 : 1];
            renderBoard(myData.board, myData.boardDOM.id, { pArmy: myData.army });
            renderBoard(opData.board, opData.boardDOM.id, { onCellClick: handleAttack });

            canPlayerAttack = true;
        }, 800);
    }
    else {
        // logic danh voi AI 
        statusText.innerText = "Status: Enemy is calculating...";
        setTimeout(() => {
            if (isGameOver) return;
            let botResult = (difficultySelect.value === 'hard') ?
                hardBotAttack(G_STATE.players[1].board, G_STATE.players[1].army) :
                easyBotAttack(G_STATE.players[1].board, G_STATE.players[1].army);

            if (botResult === "hit" || botResult === "sunk") AudioController.play('hit');
            else if (botResult === "miss") AudioController.play('miss');

            renderBoard(G_STATE.players[1].board, 'player-board', { pArmy: G_STATE.players[1].army });

            if (defeated(G_STATE.players[1].army)) {
                isGameOver = true;
                AudioController.play('defeat');
                showGameModal("DEFEAT!", "Your entire fleet has been sunk!");
            } else {
                canPlayerAttack = true;
                statusText.innerText = "Status: Your turn! Attack!";
            }
        }, 800);
    }
}

// Gui diem len server sau khi thang AI
async function submitScore(mode) {
    const token = localStorage.getItem("userToken");
    if (!token) return; // chua dang nhap thi bo qua, khong bao loi

    try {
        const res = await fetch(`${BASE_URL}/api/save-match`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ mode, result: "win" })
        });
        const data = await res.json();
        if (data.success) {
            const pts = mode === "hard" ? 3 : 1;
            console.log(`[SCORE] +${pts} pts (${mode}) => Total: ${data.score}`);

            // Cap nhat score hien thi luon
            const scoreEl = document.getElementById('user-score-display');
            if (scoreEl) scoreEl.innerText = `⭐ ${data.score} pts`;

            // Hien diem trong modal
            const modalMsg = document.getElementById('modal-message');
            if (modalMsg) modalMsg.innerText += `\n⭐ +${pts} point${pts > 1 ? "s" : ""}! Total score: ${data.score}`;
        }
    } catch (err) {
        console.error("[SCORE] Update failed:", err);
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