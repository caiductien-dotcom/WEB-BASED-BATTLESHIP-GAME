export function createBoatData() {
    let board = [];

    for (let i=0;i<10;i++){
        board[i] = [];
        for (let j=0;j<10;j++){
            board[i][j] = 0;
        }
    } 
    return board;
}