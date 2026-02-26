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
const btnH = document.getElementById('btn-horizontal');
const btnV = document.getElementById('btn-vertical');

btnH.onclick = () => {
    currentDirection = direction.HORIZONTAL; //
    btnH.classList.add('active');
    btnV.classList.remove('active');
};

btnV.onclick = () => {
    currentDirection = direction.VERTICAL; //
    btnV.classList.add('active');
    btnH.classList.remove('active');
};
renderBoard(pBoard, 'player-board',handlePlacement);
renderBoard(cBoard, 'cpu-board');