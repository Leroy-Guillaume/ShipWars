let Player = require('./player.js');
let ship = require('./ship.js');

class shipWarsGame {
    constructor(id, idPlayer0, idPlayer1) {

        this.id = id;

        //Initialisation du tableau représentant la carte du jeu.
        //Tableau de 100 cases (10x10) de caractères : V pour Vide, B pour bateau, T pour Touché, R pour raté
        this.GameMapPlayer0 = new Array(100);
        this.GameMapPlayer1 = new Array(100);

        this.playerTurn = Math.floor(Math.random() * 2);


        this.winner = undefined;
        this.loser = undefined;


        this.gameStatus = 1; //1 = in game ; 2 = game over

        this.players = [new Player(idPlayer0), new Player(idPlayer1)];

        //Initialisation des cartes
        this.initializeRandomMap(this.GameMapPlayer0);
        this.initializeRandomMap(this.GameMapPlayer1);
    }

    //Obtenir le socket id du joueur
    getPlayerId(player) {
        return this.players[player].getID();
    }

    getPlayer(index) {
        return this.players[index]
    }

    getOpponent(player) {
        let opponent;
        player == 0 ? opponent = 1 : opponent = 0;
        return opponent;
    }

    getGameId() {
        return this.id;
    }

    //Fonction pour créer une carte de 10x10 avec des bateaux placés aléatoirement.
    initializeRandomMap(GameMap) {
        //Initialisation du tableau en un ensemble de cases vide (= cases d'ocean)
        for (let i = 0; i < 100; i++) {
            GameMap[i] = "V";
        }
        //Création de tous les bateaux
        GameMap.shipList = new Array(5);
        GameMap.shipList[0] = new ship(5);
        GameMap.shipList[1] = new ship(4);
        GameMap.shipList[2] = new ship(3);
        GameMap.shipList[3] = new ship(3);
        GameMap.shipList[4] = new ship(2);

        //Pour établir la position et l'orientation de chaque bateau
        for (let i = 0; i < GameMap.shipList.length; i++) {
            //50% de chance pour chaque orientation
            if (Math.random() > 0.5) { GameMap.shipList[i].setOrientation("D"); }
            else { GameMap.shipList[i].setOrientation("R"); }
            //Tant qu'on a pas de position valide pour le bateau
            while (GameMap.shipList[i].getHeadIndex() == undefined) {
                let tmp = Math.floor(Math.random() * 100);//On génère une position aléatoire dans le tableau
                //Si la position est valide :
                if (GameMap.shipList[i].isShipFree(GameMap, tmp)) {
                    GameMap.shipList[i].setHeadIndex(tmp);//On place la position de la tête et toutes les autres cases du bateau
                    switch (GameMap.shipList[i].getOrientation()) {
                        case "D":
                            for (let j = tmp; j < tmp + (GameMap.shipList[i].getSize() * 10); j += 10) {
                                GameMap[j] = "B";
                                GameMap.shipList[i].addInTilesIndex(j);
                            }
                            break;

                        case "R":
                            for (let j = tmp; j < tmp + GameMap.shipList[i].getSize(); j++) {
                                GameMap[j] = "B";
                                GameMap.shipList[i].addInTilesIndex(j);
                            }
                            break;
                    }
                }
            }
        }
    }


    //Pour gérer l'attaque du joueur
    playerAttack(index, GameMap) {
        switch (this.players[this.playerTurn].getAttackMode()) {
            case "Missile":
                //Si le joueur tire sur une case valide (c'est à dire une case où il n'a pas déjà tiré)
                if (GameMap[index] != "R" && GameMap[index] != "T") {
                    switch (GameMap[index]) {
                        case "B"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            GameMap[index] = "T";

                            this.findWhichShipIsAttacked(GameMap, index).tileHasBeenDestroyed(index);

                            if (this.findWhichShipIsAttacked(GameMap, index).isShipDestroyed() == true) {
                                this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index), GameMap);
                            }
                            break;
                        case "BR"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            GameMap[index] = "T";
                            this.findWhichShipIsAttacked(GameMap, index).tileHasBeenDestroyed(index);
                            if (this.findWhichShipIsAttacked(GameMap, index).isShipDestroyed() == true) {
                                this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index), GameMap);
                            }
                            break;
                        case "V"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            GameMap[index] = "R";
                            this.changePlayerTurn();
                            break;
                        case "VR"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            GameMap[index] = "R";
                            this.changePlayerTurn();
                            break;
                    }
                }
                break;


            case "Radar":
                if (this.isWeaponAvailable(this.getPlayerTurn(), "Radar")) {
                    for (let i = -1; i < 2; i++) {
                        for (let j = -1; j < 2; j++) {
                            switch (GameMap[index + (i * 10) + j]) {
                                case "B":
                                    GameMap[index + (i * 10) + j] = "BR"
                                    break;
                                case "V":
                                    GameMap[index + (i * 10) + j] = "VR"
                                    break;
                            }
                        }
                    }
                    this.weaponUsed(this.getPlayerTurn(), "Radar");
                    this.changeAttackMode(this.getPlayerTurn(), "Missile");
                    this.changePlayerTurn();
                }
                break;


            case "Torpille":
                if (this.isWeaponAvailable(this.getPlayerTurn(), "Torpille")) {
                    if (GameMap[index] == "B" || GameMap[index] == "BR" || GameMap[index] == "T") {
                        if (this.findWhichShipIsAttacked(GameMap, index).getTilesIndex().length - this.findWhichShipIsAttacked(GameMap, index).getTilesDestroyedIndex().length <= 2) {
                            this.findWhichShipIsAttacked(GameMap, index).destroyShip();
                            for (let i = 0; i < this.findWhichShipIsAttacked(GameMap, index).getTilesIndex().length; i++) {
                                GameMap[this.findWhichShipIsAttacked(GameMap, index).getTilesIndex()[i]] = "T";
                            }
                            this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index), GameMap);
                        }

                        else {
                            switch (GameMap[index]) {
                                case "B"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                                    GameMap[index] = "T";
                                    this.findWhichShipIsAttacked(GameMap, index).tileHasBeenDestroyed(index);

                                    break;
                                case "BR"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                                    GameMap[index] = "T";
                                    this.findWhichShipIsAttacked(GameMap, index).tileHasBeenDestroyed(index);

                                    break;
                                case "V"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                                    GameMap[index] = "R";

                                    break;
                                case "VR"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                                    GameMap[index] = "R";

                                    break;
                            }
                        }
                    }
                    else {
                        GameMap[index] = "R";
                    }
                    this.weaponUsed(this.getPlayerTurn(), "Torpille");
                    this.changeAttackMode(this.getPlayerTurn(), "Missile");
                    this.changePlayerTurn();
                }
                break;

            case "Bombe":
                if (this.isWeaponAvailable(this.getPlayerTurn(), "Bombe")) {
                    for (let i = -10; i <= 10; i += 10) {
                        switch (GameMap[index + i]) {
                            case "B"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                                GameMap[index + i] = "T";
                                this.findWhichShipIsAttacked(GameMap, index + i).tileHasBeenDestroyed(index + i);

                                if (this.findWhichShipIsAttacked(GameMap, index + i).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index + i), GameMap);
                                }
                                break;
                            case "BR"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                                GameMap[index + i] = "T";
                                this.findWhichShipIsAttacked(GameMap, index + i).tileHasBeenDestroyed(index + i);

                                if (this.findWhichShipIsAttacked(GameMap, index + i).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index + i), GameMap);
                                }

                                break;
                            case "V"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                                GameMap[index + i] = "R";

                                break;
                            case "VR"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                                GameMap[index + i] = "R";

                                break;
                        }
                    }

                    switch (GameMap[index - 1]) {
                        case "B"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            if ((index - 1) % 10 != 9) {
                                GameMap[index - 1] = "T";
                                this.findWhichShipIsAttacked(GameMap, index - 1).tileHasBeenDestroyed(index - 1);

                                if (this.findWhichShipIsAttacked(GameMap, index - 1).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index - 1), GameMap);
                                }
                            }
                            break;
                        case "BR"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            if ((index - 1) % 10 != 9) {
                                GameMap[index - 1] = "T";
                                this.findWhichShipIsAttacked(GameMap, index - 1).tileHasBeenDestroyed(index - 1);

                                if (this.findWhichShipIsAttacked(GameMap, index - 1).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index - 1), GameMap);
                                }

                            }
                            break;
                        case "V"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            if ((index - 1) % 10 != 9) {
                                GameMap[index - 1] = "R";

                            }
                            break;
                        case "VR"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            if ((index - 1) % 10 != 9) {
                                GameMap[index - 1] = "R";

                            }
                            break;
                    }
                    switch (GameMap[index + 1]) {
                        case "B"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            if ((index + 1) % 10 != 0) {
                                GameMap[index + 1] = "T";
                                this.findWhichShipIsAttacked(GameMap, index + 1).tileHasBeenDestroyed(index + 1);

                                if (this.findWhichShipIsAttacked(GameMap, index + 1).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index + 1), GameMap);
                                }
                            }
                            break;
                        case "BR"://Si c'est un bateau, on indique qu'on a touché dans le tableau -> T
                            if ((index + 1) % 10 != 0) {
                                GameMap[index + 1] = "T";
                                this.findWhichShipIsAttacked(GameMap, index + 1).tileHasBeenDestroyed(index + 1);

                                if (this.findWhichShipIsAttacked(GameMap, index + 1).isShipDestroyed() == true) {
                                    this.shipHasBeenSunked(this.findWhichShipIsAttacked(GameMap, index + 1), GameMap);
                                }
                            }
                            break;
                        case "V"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            if ((index + 1) % 10 != 0) {
                                GameMap[index + 1] = "R";
                            }
                            break;
                        case "VR"://Si c'est une case vide, on indique qu'on a raté -> R et le tour passe au joueur adverse
                            if ((index + 1) % 10 != 0) {
                                GameMap[index + 1] = "R";
                            }
                            break;
                    }

                    this.weaponUsed(this.getPlayerTurn(), "Bombe");
                    this.changeAttackMode(this.getPlayerTurn(), "Missile");
                    this.changePlayerTurn();
                }

                break;
        }
    }

    //Fonction pour changer le tour entre les joueurs
    changePlayerTurn() {
        if (this.playerTurn == 0) {
            this.playerTurn = 1
        }
        else {
            this.playerTurn = 0;
        }
    }

    //Retourne c'est au tour de quel joueur de jouer
    getPlayerTurn() {
        return this.playerTurn;
    }

    //Retourne si l'arme a été utilisée par le joueur
    weaponUsed(player, weapon) {

        switch (weapon) {
            case "Radar":
                this.players[player].weaponHasBeenUsed(weapon);
                break;
            case "Torpille":
                this.players[player].weaponHasBeenUsed(weapon);
                break;

            case "Bombe":
                this.players[player].weaponHasBeenUsed(weapon);
                break;
        }
    }

    //Retourne si l'arme est disponible ou pas
    isWeaponAvailable(player, weapon) {
        switch (weapon) {
            case "Radar":
                if (this.players[player].getWeaponUsed().radar == false) {
                    return true;
                }
                else {
                    return false
                }
            case "Torpille":
                if (this.players[player].getWeaponUsed().torpille == false) {
                    return true;
                }
                else {
                    return false;
                }
            case "Bombe":
                if (this.players[player].getWeaponUsed().bombe == false) {
                    return true;
                }
                else {
                    return false;
                }
        }
    }

    //Retourne si la carte est terminée
    isMapFinished(GameMap) {
        //On vérifie s'il reste des cases bateau dans le tableau
        for (let i = 0; i < GameMap.length; i++) {
            if (GameMap[i] == "B") {
                return false; //Si oui, alors la partie n'est pas terminé pour ce joueur
            }
        }
        this.gameStatus = 2;
        return true;
    }

    //On vérifie les deux cartes pour voir si la partie est terminée
    isGameFinished() {
        if (this.isMapFinished(this.GameMapPlayer0) || this.isMapFinished(this.GameMapPlayer1)) {
            this.setWinner();
            this.gameStatus = 2;
            return true
        }
        else {
            return false;
        }
    }

    //Annule la partie
    abortGame(player) {
        //Donne la victoire à l'opposant
        this.gameStatus = 2;
        if (player == 0) {
            this.winner = this.players[1].getID();
            this.loser = this.players[0].getID();
        }
        else {
            this.winner = this.players[0].getID();
            this.loser = this.players[1].getID();
        }
    }


    //On vérifie chaque carte, si la carte du joueur 1 est finie (= il n'y a plus de bateau), alors le joueur 0 gagne et inversement
    //La fonction retourne l'id du joueur
    setWinner() {
        if (this.isMapFinished(this.GameMapPlayer0)) {
            this.winner = this.players[1].getID(); //Le gagnant est le joueur 1
            this.loser = this.players[0].getID();//Le perdant est le joueur 0
            return this.winner;
        }

        if (this.isMapFinished(this.GameMapPlayer1)) {
            this.winner = this.players[0].getID(); //Le gagnant est le joueur 0
            this.loser = this.players[1].getID();//Le perdant est le joueur 1
            return this.winner;
        }

        this.winner = undefined //Sinon, il n'y a pas de gagnant
        this.loser = undefined //Sinon, il n'y a pas de perdant
        return this.winner;
    }

    //Retourne l'id du gagnant
    getWinner() {
        return this.winner;
    }
    //La fonction retourne l'id du perdant
    getLoser() {
        return this.loser;
    }

    //Retourne la grille de l'adversaire sans les bateaux
    getOpponentGridWithShipsHidden(player) {
        if (player === 0) {
            let tmp = Array.from(this.GameMapPlayer1);
            for (let j = 0; j < 100; j++) {
                if (tmp[j] == "B") {
                    tmp[j] == "V"
                }
            }
            return tmp;
        }
        else {
            let tmp = Array.from(this.GameMapPlayer0);
            for (let j = 0; j < 100; j++) {
                if (tmp[j] == "B") {
                    tmp[j] == "V"
                }
            }
            return tmp;
        }
    }

    //Retourne la grille du joueur
    getSelfGridOnlyBoats(player) {
        if (player === 0) {
            let tmp = Array.from(this.GameMapPlayer0);
            return tmp;
        }
        else {
            let tmp = Array.from(this.GameMapPlayer1);
            return tmp;
        }
    }

    //Retourne la grille du joueur V2
    getGameMap(player) {
        if (player == 0) { return this.GameMapPlayer0 } else { return this.GameMapPlayer1 }
    }

    //Pour savoir c'est au tour de quel joueur de jouer
    getPlayerTurn() {
        return this.playerTurn;
    }

    //Change l'arme du joueur
    changeAttackMode(userNb, newMode) {
        this.players[userNb].changeAttackMode(newMode);
    }

    //Trouve quel bateau est attaqué
    findWhichShipIsAttacked(GameMap, index) {
        for (let i = 0; i < GameMap.shipList.length; i++) {
            for (let j = 0; j < GameMap.shipList[i].getTilesIndex().length; j++) {
                if (GameMap.shipList[i].getTilesIndex()[j] == index) {
                    return GameMap.shipList[i];
                }
            }
        }
    }


    //Renvoie la grille selon les paramètres : gridowner : qui possède la grille ; hideShips : qui observe la grille 
    getGrid(gridOwner, hideShips) {
        let gridToReturn = Array.from(this.getGameMap(gridOwner));
        if (gridOwner != hideShips) {//On cache les bateaux avant d'envoyer la carte si on doit envoyer la carte du joueur adverse
            for (let i = 0; i < gridToReturn.length; i++) {
                if (gridToReturn[i] == "B") {
                    gridToReturn[i] = "V";
                }
            }
        }
        return gridToReturn;

    }

    // 1 = in game 2 = game over
    getGameStatus() {
        return this.gameStatus; 
    }

    //Retourne si le bateau a été coulé ou non
    shipHasBeenSunked(ship, GameMap) {
        if (ship.isShipDestroyed()) {
            for (let i of ship.getTilesIndex()) {
                GameMap[i] = "S"
            }
        }
    }

}





module.exports = shipWarsGame;


