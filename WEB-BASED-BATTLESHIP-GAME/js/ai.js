import { placeShip, isValidPlacement, receiveAttack } from "./board.js";
import { board_size, cell_types, direction } from "./constants.js";
import { playerShipArmy } from "./ship.js";

const cShipArmy = playerShipArmy();
let shipIndex = 0;
let targetQueue = [];

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
            if (placeShip({
                board: cBoard, 
                ship: ship, 
                row: randomRow, 
                col: randomColumn, 
                dirVector: randomDirection
            })) {
                validPlacement = true;
            }
        }
    }
}

export function easyBotAttack(pBoard, pArmy){
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


function huntingTarget(board) {
    let possibleTarget = [];
    for (let r=0;r<board_size;r++){
        for (let c=0;c<board_size;c++){
            if ((r + c) % 2 === 0){
                if (board[r][c] !== cell_types.hit && board[r][c] !== cell_types.miss){
                    possibleTarget.push({row : r, column : c});
                }
            }
        }
    }
    if (possibleTarget.length === 0){
        for (let r=0;r<board_size;r++){
            for (let c=0;c<board_size;c++){
                if (board[r][c] !== cell_types.hit && board[r][c] !== cell_types.miss){
                    possibleTarget.push({row : r, column : c});
                }
            }
        }
    }
    if (possibleTarget.length > 0){
        const randomTarget = Math.floor(Math.random() * possibleTarget.length);
        return possibleTarget[randomTarget];
    }
    return null;
}

let AIMemory = {
    originHit : null,
    currentDirection : null,
    potentialQueue : [],
    lineQueue : [],
}

export function memoryReset() {
    AIMemory.originHit = null;
    AIMemory.currentDirection = null;
    AIMemory.potentialQueue = [];
    AIMemory.lineQueue = [];
}

function isValid(board, position){
    return position.row >= 0 && position.row < board_size && position.column >= 0 && position.column < board_size && board[position.row][position.column] !== cell_types.hit && board[position.row][position.column] !== cell_types.miss;
}
function getOpposite(originHit, currentPosition){
    return {
        row : originHit.row - (currentPosition.row - originHit.row),
        column : originHit.column - (currentPosition.column - originHit.column)
    };
}
function getNext(currentPosition, currentDirection, originHit){
    let nextRow = currentPosition.row;
    let nextColumn = currentPosition.column;

    if (currentDirection === direction.VERTICAL){
        if (currentPosition.row > originHit.row){
            nextRow = currentPosition.row + 1;
        }
        else {
            nextRow = currentPosition.row - 1;
        }
    }
    else if (currentDirection === direction.HORIZONTAL) {
        if (currentPosition.column > originHit.column){
            nextColumn = currentPosition.column + 1;
        }
        else {
            nextColumn = currentPosition.column - 1;
        }
    }

    return {
        row : nextRow,
        column : nextColumn
    };
}

function shiftRandomElement(arr) {
  // 1. Generate a random index
  const randomIndex = Math.floor(Math.random() * arr.length);

  // 2. Remove the element at the random index using splice()
  const removedElements = arr.splice(randomIndex, 1);

  // 3. Return the removed element (the first and only item in the removedElements array)
  return removedElements[0];
}



function destroyTarget(board, army){
    let target = null;

    if (AIMemory.lineQueue.length > 0){
        target = shiftRandomElement(AIMemory.lineQueue);
    }
    else if (AIMemory.potentialQueue.length > 0){
        target = shiftRandomElement(AIMemory.potentialQueue);
    }

    if (!target){
        AIMemory.originHit = null;
        return "back-to-huntmode";
    } 

    const result = receiveAttack(board, target.row, target.column, army);

    if (result === "hit"){
        if (AIMemory.currentDirection === null){
            AIMemory.currentDirection = (target.row === AIMemory.originHit.row) ? direction.HORIZONTAL : direction.VERTICAL;

            AIMemory.potentialQueue = [];

            const opposite = getOpposite(AIMemory.originHit, target);
            if (isValid(board, opposite)) AIMemory.lineQueue.push(opposite);
        }

        const next = getNext(target, AIMemory.currentDirection, AIMemory.originHit);
        if (isValid(board, next)) AIMemory.lineQueue.unshift(next);
    }
    else if (result === "miss") {
        AIMemory.originHit = null;
    } else if (result === "sunk") {
        memoryReset();
    }
    return result;
}

function aroundCheck(currentPosition){
    return [
        { row: currentPosition.row - 1, column: currentPosition.column },
        { row: currentPosition.row + 1, column: currentPosition.column },
        { row: currentPosition.row, column: currentPosition.column - 1 },
        { row: currentPosition.row, column: currentPosition.column + 1 },
    ];
}

export function hardBotAttack(pBoard, pArmy){
    if (!AIMemory.originHit){
        const target = huntingTarget(pBoard);
        if (!target) return "invalid";
        const result = receiveAttack(pBoard, target.row, target.column, pArmy);
        if (result === "hit") {
            AIMemory.originHit = target;
            const neighbors = aroundCheck(target);
            for (let n of neighbors) {
                if (isValid(pBoard, n)) AIMemory.potentialQueue.push(n);
            }
        }
        console.log('AI Memory Hunting Mode:', {
            originHit: AIMemory.originHit,
            currentDirection: AIMemory.currentDirection,
            potentialQueue: [...AIMemory.potentialQueue],
            lineQueue: [...AIMemory.lineQueue],
            result: result
        });
        return result;
    }
    let result = destroyTarget(pBoard, pArmy);
    if (result === "back-to-huntmode") {
        const target = huntingTarget(pBoard);
        if (target) {
            console.log('AI Memory Back To Hunt:', {
            originHit: AIMemory.originHit,
            currentDirection: AIMemory.currentDirection,
            potentialQueue: [...AIMemory.potentialQueue],
            lineQueue: [...AIMemory.lineQueue],
            result: result
            });
            result = receiveAttack(pBoard, target.row, target.column, pArmy);    
        }
    }
    console.log('AI Memory Destroy Mode:', {
        originHit: AIMemory.originHit,
        currentDirection: AIMemory.currentDirection,
        potentialQueue: [...AIMemory.potentialQueue],
        lineQueue: [...AIMemory.lineQueue],
        result: result
    });
    return result;
}






