import { createBoatData, placeShip, receiveAttack, defeated } from "./board.js";
import { renderBoard } from "./ui.js";
import { direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";
import { placeCPUShips, easyBotAttack } from "./ai.js"; 

let currentDirection = direction.HORIZONTAL;
const pArmy = playerShipArmy();
const cArmy = playerShipArmy();
let shipIndex = 0;
let isGameOver = false;

const pBoard = createBoatData();
const cEasyBoard = createBoatData();
const cHardBoard = createBoatData();

function handlePlacement(row, column) {
    if(shipIndex >= pArmy.length) return;
    const currentShip = pArmy[shipIndex];
    const success =placeShip(pBoard, currentShip, row, column, currentDirection);
    if (success) {
        shipIndex++;
        renderBoard(pBoard, 'player-board', handlePlacement);
        if (shipIndex === pArmy.length) {
            alert("All ships placed! Ready to fire!");
            startBattle();
        }
    } else {
        alert("Invalid placement. Try again.");
    }    
}
function startBattle() {
    placeCPUShips(cEasyBoard, cArmy); 
    renderBoard(cEasyBoard, 'cpu-board', handleAttack); 
    document.querySelector('.controls').style.display = 'none';
}
function handleAttack(row, column) {
    if (isGameOver) return;
    const result = receiveAttack(cEasyBoard, row, column, cArmy);
    if (result === "invalid") return; 
    renderBoard(cEasyBoard, 'cpu-board', handleAttack); 
    if (defeated(cArmy)) {
        alert("VICTORY! You have defeated the enemy fleet!");
        isGameOver = true;
        return;
    }

    setTimeout(() => {
        easyBotAttack(pBoard, pArmy);
        renderBoard(pBoard, 'player-board'); 
        if (defeated(pArmy)) {
            alert("DEFEAT! You have been defeated by the enemy fleet.");
            isGameOver = true;
        }
    }, 600);
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
    currentDirection = direction.HORIZONTAL; 
    btnH.classList.add('active');
    btnV.classList.remove('active');
};

btnV.onclick = () => {
    currentDirection = direction.VERTICAL; 
    btnV.classList.add('active');
    btnH.classList.remove('active');
};
renderBoard(pBoard, 'player-board',handlePlacement);
renderBoard(cEasyBoard, 'cpu-board');