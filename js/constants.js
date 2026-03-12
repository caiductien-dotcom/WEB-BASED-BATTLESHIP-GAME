export const board_size = 10;
export const cell_types = {
    empty: 0,
    ship: 1,
    hit: 2,
    miss: 3
};

export const direction = {
    HORIZONTAL: { dx: 1, dy: 0 },
    VERTICAL: { dx: 0, dy: 1 }
};

export const phase = {
    SETUP: 0,
    BATTLE: 1,
}