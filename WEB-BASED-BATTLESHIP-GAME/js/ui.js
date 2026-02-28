import { cell_types, direction } from "./constants.js";

export function renderBoard(data, containerId, { onCellClick, pArmy } = {}) {
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

            if (onCellClick) {
                cell.onclick = () => onCellClick(i, j);
            }

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