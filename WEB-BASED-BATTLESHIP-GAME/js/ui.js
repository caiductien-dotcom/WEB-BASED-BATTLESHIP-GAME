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

    if (containerId === 'player-board' && pArmy) {
        pArmy.forEach(ship => {
            if (ship.placed) {
                const { row, col, direction: shipDir } = ship.placed;
                const shipEl = document.createElement("div");

                shipEl.classList.add("ship-display", ship.shipName.toLowerCase());

                shipEl.style.top = `${row * cellSize}px`;
                shipEl.style.left = `${col * cellSize}px`;
                shipEl.style.width = `${ship.shipSize * cellSize}px`;
                shipEl.style.height = `${cellSize}px`;

                if (shipDir === direction.VERTICAL) {
                    shipEl.classList.add("vertical");
                    shipEl.style.left = `${(col + 1) * cellSize}px`;
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