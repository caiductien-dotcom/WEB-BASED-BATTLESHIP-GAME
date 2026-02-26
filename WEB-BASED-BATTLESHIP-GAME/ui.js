import { cell_types } from "./constants.js";
export function renderBoard(data,containerId,onCellClick) {
    const boardElement = document.getElementById(containerId);
    if (!boardElement) return;
    boardElement.innerHTML = "";
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
            const cellValue = data[i][j];
            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");
            if (onCellClick) {
                cellElement.onclick = () => onCellClick(i, j);
            }
            switch (cellValue) {
                case cell_types.empty:
                    cellElement.classList.add("empty");
                    break;
                case cell_types.ship:
                    cellElement.classList.add("ship");
                    break;
                case cell_types.hit:
                    cellElement.classList.add("hit");
                    break;
                case cell_types.miss:
                    cellElement.classList.add("miss");
                    break;
                default:
                    break;
            }
            boardElement.appendChild(cellElement);
        }
    }
}