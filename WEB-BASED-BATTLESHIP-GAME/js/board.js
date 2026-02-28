import { board_size, cell_types } from "./constants.js";

export function createBoatData() {
    let board = [];
    for (let i = 0; i < board_size; i++) {
        board[i] = Array(board_size).fill(cell_types.empty);
    } 
    return board;
}

/**  
    * Use to validate the placement of the ship
    * @param {Array} board - 10x10 array
    * @param {number} row - start row
    * @param {number} column - start column
    * @param {number} shipSize - ship's size
    * @param {String} direction - the direction(horizontal or vertical) of the ship
    * @returns {boolean} - true if the placement is valid, else false
*/
export function isValidPlacement(board, shipSize, row, col, dirVector) {
    for (let i = 0; i < shipSize; i++) {
        const r = row + i * dirVector.dy;
        const c = col + i * dirVector.dx;

        if (r >= board_size || c >= board_size || r < 0 || c < 0) return false;
        if (board[r][c] !== cell_types.empty) return false;
    }
    return true;
}

export function placeShip({ board, ship, row, col, dirVector }) {
    if (!isValidPlacement(board, ship.shipSize, row, col, dirVector)) {
        return false;
    }

    ship.placed = { row, col, direction: dirVector }; 
    ship.placedDirection = dirVector; 

    for (let i = 0; i < ship.shipSize; i++) {
        const r = row + i * dirVector.dy;
        const c = col + i * dirVector.dx;

        board[r][c] = ship.shipName.toLowerCase(); 
        ship.position.push({ row: r, col: c });
    }
    
    return true;
}

export function receiveAttack(board, row, col, army) {
    const cellValue = board[row][col];
    
    if (cellValue === cell_types.hit || cellValue === cell_types.miss) {
        return "invalid";
    }

    if (typeof cellValue === 'string') {
        board[row][col] = cell_types.hit;

        const targetShip = army.find(s => 
            s.position.some(p => p.row === row && p.col === col)
        );

        if (targetShip) {
            targetShip.hit();
            return targetShip.sinkState ? "sunk" : "hit";
        }
    } else {
        board[row][col] = cell_types.miss;
        return "miss";
    }
}

export function defeated(army) {
    return army.every(ship => ship.sinkState === true);
}