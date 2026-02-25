import { createBoatData } from "./board.js";
import { renderBoard } from "./ui.js";

const pBoard = createBoatData();
const cBoard = createBoatData();

pBoard[0][0] = 1;
pBoard[1][1] = 2;

renderBoard(pBoard, 'player-board');
renderBoard(cBoard, 'cpu-board');