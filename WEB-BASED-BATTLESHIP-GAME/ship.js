const SHIPS_CREATOR = [
    { shipName: 'Carrier', shipSize: 5},
    { shipName: 'Battleship', shipSize: 4},
    { shipName: 'Cruiser', shipSize: 3},
    { shipName: 'Submarine', shipSize: 2},
    { shipName: 'Destroyer', shipSize: 1}
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
            if (this.hitCounter >= this.shipSize){
                this.sinkState = true;
            }
        }
    };
};

export const playerShipArmy = () => {
    return SHIPS_CREATOR.map(ship => createShip(ship.name, ship.size));
}