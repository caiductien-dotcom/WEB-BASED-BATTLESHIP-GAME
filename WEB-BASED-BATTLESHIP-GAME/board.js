import { board_size, cell_types } from "./constants.js";

export function createBoatData() {
    let board = [];

    for (let i=0;i<board_size;i++){
        board[i] = [];
        for (let j=0;j<board_size;j++){
            board[i][j] = cell_types.empty;
        }
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

export function isValidPlacement(board, shipSize, row, column, direction){
    for (let i=0;i<shipSize;i++){
        let currentRow = row;
        let currentColumn = column;
        if (direction === "horizontal") {
            currentRow = row;
            currentColumn = column + i;
        }
        else {
            currentRow = row + i;
            currentColumn = column;
        }

        if (currentRow > board_size-1 || currentColumn > board_size-1 || currentRow < 0 || currentColumn < 0) {
            return false;
        }
        if (board[currentRow][currentColumn] !== cell_types.empty){
            return false;
        }
    }
    return true;
}

export function placeShip(board, ship, row, column, direction) {
    const shipSize = ship.shipSize;
    if (!isValidPlacement(board, shipSize, row, column, direction)) {
        return false;
    }

    for (let i=0;i<shipSize;i++){
        const currentRow = (direction === "horizontal") ? row : row + i;
        const currentColumn = (direction === "horizontal") ? column + i : column;

        board[currentRow][currentColumn] = cell_types.ship;
        ship.position.push({row : currentRow, column : currentColumn});
    }
    
    return true;
}

export function receiveAttack(board, row, column, army){
    const currentPosition = board[row][column];
    

    if (currentPosition === cell_types.hit || currentPosition === cell_types.miss) {
        return "invalid";
    }

    if (currentPosition === cell_types.ship) {
        board[row][column] = cell_types.hit;

        let targetShip = null;

        for (const ship of army){
            for (const position of ship.position){
                if (position.row === row && position.column === column) {
                    targetShip = ship;
                    break;
                }
            }
            if (targetShip) break;
        }
        if (targetShip) {
            targetShip.hit();
            if (targetShip.sinkState){
                return "sunk";
            }
            return "hit"
        }
    }
    else {
        board[row][column] = cell_types.miss;
        return "miss";
    }
}

export function defeated(army) {
    return army.every(ship => ship.sinkState === true);
}