import { createBoatData, isValidPlacement, placeShip } from "./board.js";
import { renderBoard } from "./ui.js";
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";

let currentDirection = direction.HORIZONTAL;
const myArmy = playerShipArmy();
/**
 * Use this function to change the direction of the ship
 */
export function toggleDirection() {
    currentDirection = (currentDirection === direction.HORIZONTAL) ? direction.VERTICAL : direction.HORIZONTAL;
    
    return currentDirection;
}
/**
 * Use this function to return the direction of the ship
 */
export function getShipDirection() {
    return currentDirection;
}



const pBoard = createBoatData();
const cBoard = createBoatData();

const carrier = myArmy[0];
const success = placeShip(pBoard, carrier, 0, 0, direction.HORIZONTAL);
const newShip = placeShip(pBoard, carrier, 5, 6, direction.VERTICAL);

renderBoard(pBoard, 'player-board');
renderBoard(cBoard, 'cpu-board');