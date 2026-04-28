import { cell_types, direction } from "./constants.js";

export function renderBoard(data, containerId, { onCellClick, onMouseOver, onMouseOut, pArmy, shotClass, onShipDragEnd, onShipDragStart } = {}) {
    const boardElement = document.getElementById(containerId);
    if (!boardElement) return;

    boardElement.innerHTML = "";
    boardElement.__boardData = data;

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            const cellValue = data[i][j];
            const cell = document.createElement("div");
            cell.classList.add("cell");

            if (cellValue === cell_types.hit) {
                cell.classList.add("hit");
                if (shotClass) cell.classList.add(shotClass);
            } else if (cellValue === cell_types.miss) {
                cell.classList.add("miss");
                if (shotClass) cell.classList.add(shotClass);
            }

            if (onCellClick) cell.onclick = () => onCellClick(i, j);
            if (onMouseOver) cell.onmouseover = () => onMouseOver(i, j);
            if (onMouseOut)  cell.onmouseout = () => onMouseOut();

            boardElement.appendChild(cell); 
        }
    }

    const cellSize = 40;

    if (pArmy) {
        pArmy.forEach((ship, shipIdx) => {
            if (ship.placed && ship.position && ship.position.length > 0) {
                const head = ship.position[0];
                const isVertical = ship.position.length > 1 && ship.position[0].col === ship.position[1].col;
                
                const shipEl = document.createElement("div");
                shipEl.classList.add("ship-display", ship.shipName.toLowerCase());
                shipEl.dataset.index = shipIdx;

                if (isVertical) {
                    shipEl.classList.add("vertical");
                    shipEl.style.width = `${ship.shipSize * cellSize}px`;
                    shipEl.style.height = `${cellSize}px`;
                    shipEl.style.top = `${head.row * cellSize}px`;
                    shipEl.style.left = `${head.col * cellSize}px`;
                    shipEl.style.transformOrigin = "top left";
                    shipEl.style.transform = `rotate(90deg) translateY(-${cellSize}px)`;
                } else {
                    shipEl.style.width = `${ship.shipSize * cellSize}px`;
                    shipEl.style.height = `${cellSize}px`;
                    shipEl.style.top = `${head.row * cellSize}px`;
                    shipEl.style.left = `${head.col * cellSize}px`;
                }

                // Cho phep keo tau tu board sang o khac
                shipEl.draggable = true;
                shipEl.style.pointerEvents = 'auto';
                shipEl.style.cursor = 'grab';

                shipEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('shipIndex', shipIdx);
                    e.dataTransfer.setData('fromBoard', 'true');

                    // Tao custom ghost
                    const ghost = document.createElement('div');
                    ghost.style.position = 'absolute';
                    ghost.style.top = '-1000px';
                    ghost.style.backgroundImage = window.getComputedStyle(shipEl).backgroundImage;
                    ghost.style.backgroundSize = '100% 100%';
                    ghost.style.backgroundRepeat = 'no-repeat';
                    ghost.style.width = `${ship.shipSize * cellSize}px`;
                    ghost.style.height = `${cellSize}px`;
                    document.body.appendChild(ghost);
                    e.dataTransfer.setDragImage(ghost, ghost.offsetWidth / 2, ghost.offsetHeight / 2);

                    setTimeout(() => {
                        document.body.removeChild(ghost);
                        shipEl.style.opacity = '0.3';
                    }, 0);

                    // Thong bao game.js tau nao dang duoc keo
                    if (onShipDragStart) onShipDragStart(shipIdx);
                });

                shipEl.addEventListener('dragend', () => {
                    shipEl.style.opacity = '1';
                    if (onShipDragEnd) onShipDragEnd();
                });

                boardElement.appendChild(shipEl);
            }
        });
    }
}

export function renderDock(army, currentDir) {
    const dock = document.getElementById('ship-dock');
    if (!dock) return;
    dock.innerHTML = "";

    army.forEach((ship, index) => {
        if (!ship.placed) {
            const shipDiv = document.createElement('div');
            shipDiv.classList.add('dock-ship', ship.shipName.toLowerCase());
            shipDiv.dataset.index = index; 

            if (currentDir === direction.VERTICAL) {
                shipDiv.classList.add('vertical');
            }

            shipDiv.draggable = true;
            
            shipDiv.ondragstart = (e) => {
                e.dataTransfer.setData('shipIndex', e.target.dataset.index);
                shipDiv.style.opacity = '0.5';
            };
            
            shipDiv.ondragend = () => {
                shipDiv.style.opacity = '1';
            };
            
            dock.appendChild(shipDiv);
        }
    });
}
