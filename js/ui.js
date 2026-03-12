import { cell_types, direction } from "./constants.js";

export function renderBoard(data, containerId, { onCellClick, onMouseOver, onMouseOut, pArmy } = {}) {
    const boardElement = document.getElementById(containerId);
    if (!boardElement) return;

    boardElement.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            const cellValue = data[i][j];
            const cell = document.createElement("div");
            cell.classList.add("cell");

            if (cellValue === cell_types.hit) {
                cell.classList.add("hit");
            } else if (cellValue === cell_types.miss) {
                cell.classList.add("miss");
            }

            if (onCellClick) cell.onclick = () => onCellClick(i, j);
            if (onMouseOver) cell.onmouseover = () => onMouseOver(i, j);
            if (onMouseOut)  cell.onmouseout = () => onMouseOut();

            boardElement.appendChild(cell); 
        }
    }

    const cellSize = 40;

    if (pArmy) {
        pArmy.forEach(ship => {
            if (ship.placed && ship.position && ship.position.length > 0) {
                const head = ship.position[0];
                const isVertical = ship.position.length > 1 && ship.position[0].col === ship.position[1].col;
                
                const shipEl = document.createElement("div");
                shipEl.classList.add("ship-display", ship.shipName.toLowerCase());

                shipEl.style.top = `${head.row * cellSize}px`;
                shipEl.style.left = `${head.col * cellSize}px`;

                if (isVertical) {
                    shipEl.classList.add("vertical");
                    shipEl.style.width = `${cellSize}px`;
                    shipEl.style.height = `${ship.shipSize * cellSize}px`;
                } else {
                    shipEl.style.width = `${ship.shipSize * cellSize}px`;
                    shipEl.style.height = `${cellSize}px`;
                }

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