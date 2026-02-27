import { placeShip, isValidPlacement, receiveAttack } from "./board.js";
import { board_size, direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";

const cShipArmy = playerShipArmy();
let shipIndex = 0;

/**
 * Use this function to make the ai place its ships randomly for EASY ai
 * @param {Array} cBoard - CPU's 10x10 board
 * @param {Array} cShipArmy - CPU's ship army 
 */
export function placeCPUShips(cBoard, cShipArmy) {
    for (const ship of cShipArmy) {
        let validPlacement = false;
        while (!validPlacement) {
            let randomRow = Math.floor(Math.random() * board_size);
            let randomColumn = Math.floor(Math.random() * board_size);
            let randomDirection = (Math.floor(Math.random() * 2)) ? direction.HORIZONTAL : direction.VERTICAL;
            if (placeShip(cBoard, ship, randomRow, randomColumn, randomDirection)) {
                validPlacement = true;
            }
        }
    }
}

export function botAttack(pBoard, pArmy){
    let isValidAttack = false;
    let result = null;
    while (!isValidAttack) {
        let randomRow = Math.floor(Math.random() * board_size);
        let randomColumn = Math.floor(Math.random() * board_size);

        result = receiveAttack(pBoard, randomRow, randomColumn, pArmy);

        if (result !== "invalid") {
            isValidAttack = true;
        }
    }
    return result;
}





