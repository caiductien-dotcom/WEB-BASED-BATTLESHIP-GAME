const CELL_TYPES = {
    EMPTY: 0,
    SHIP: 1,
    HIT: 2,
    MISS: 3
};
function createBoardData() { 
    return Array(10).fill(null).map(() => Array(10).fill(0)); 
}