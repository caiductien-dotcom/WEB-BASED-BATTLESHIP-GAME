import { createBoatData, isValidPlacement, placeShip } from "./board.js";
import { renderBoard } from "./ui.js";
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";

let currentDirection = direction.HORIZONTAL;
const myArmy = playerShipArmy();
let shipIndex = 0;

const pBoard = createBoatData();
const cBoard = createBoatData();

function handlePlacement(row, column) {
    if(shipIndex >= myArmy.length) return;
    const currentShip =myArmy[shipIndex];
    const success =placeShip(pBoard, currentShip, row, column, currentDirection);
    if (success) {
        shipIndex++;
        renderBoard(pBoard, 'player-board', handlePlacement);
        if (shipIndex === myArmy.length) {
            alert("All ships placed! Ready to fire!");
        }
    } else {
        alert("Invalid placement. Try again.");
    }    
}
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

window.onkeydown = (e) => {
    if (e.key.toLowerCase() === 'r') {
        toggleDirection(); 
        console.log("New direction:", currentDirection);
    }
};
renderBoard(pBoard, 'player-board',handlePlacement);
renderBoard(cBoard, 'cpu-board');