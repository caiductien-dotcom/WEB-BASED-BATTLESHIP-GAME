const SHIPS_CREATOR = [
    { name: 'Carrier', size: 5 },
    { name: 'Battleship', size: 4 },
    { name: 'Cruiser', size: 3 },
    { name: 'Submarine', size: 2 },
    { name: 'Destroyer', size: 1 }
];

export const createShip = (shipName, shipSize) => {
    return {
        shipName : shipName,
        shipSize : shipSize,
        position : [],
        hitCounter : 0,
        sinkState : false,

        hit() {
            this.hitCounter++;
            if (this.hitCounter >= shipSize){
                this.sinkState = true;
            }
        }
    };
};

export const playerShipArmy = () => {
    return SHIPS_CREATOR.map(ship => createShip(ship.shipName, ship.shipSize));
}