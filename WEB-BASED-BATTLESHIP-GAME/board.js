import { board_size } from "./constants";

export function createBoatData() {
    let board = [];

    for (let i=0;i<board_size;i++){
        board[i] = [];
        for (let j=0;j<board_size;j++){
            board[i][j] = 0;
        }
    }
}