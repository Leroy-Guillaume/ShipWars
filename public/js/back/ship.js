//Classe pour créer les bateaux
class ship {
    constructor(size) {
        this.size = size;//Taille
        this.headIndex = undefined;//Index de la tête du bateau (= quelle case dans le tableau)
        this.orientation = undefined; // D = Down R = right. Pour l'orientation, la bateau continue dans le sens de l'orientation depuis la tête.
        this.TilesIndex = new Array();
        this.tilesDestroyedIndex = new Array();
    }

    //Pour récupérer la taille
    getSize() {
        return this.size;
    }

    //Pour définir l'index de la tête
    setHeadIndex(headIndex) {
        this.headIndex = headIndex;
    }

    //Pour récupérer la position de la tête
    getHeadIndex() {
        return this.headIndex;
    }

    //Pour définir l'orientation du bateau
    setOrientation(orientation) {
        this.orientation = orientation;
    }

    //Pour récupérer l'orientation du bateau
    getOrientation() {
        return this.orientation;
    }

    //Ajoute la case au tableau les répertoriant
    addInTilesIndex(index){
        this.TilesIndex.push(index);
    }

    //Récupère le tableau des cases du bateau
    getTilesIndex(){
        return this.TilesIndex;
    }

    //Ajoute la case au tableau répertoriant les cases détruites
    tileHasBeenDestroyed(index){
        this.tilesDestroyedIndex.push(index);
    }

        //Récupère le tableau des cases détruites du bateau
    getTilesDestroyedIndex(){
        return this.tilesDestroyedIndex;
    }

    //Permet de savoir si le bateau est détruit
    isShipDestroyed(){
        if(this.TilesIndex.length == this.tilesDestroyedIndex.length){
            return true;
        }
        return false;
    }

    //Détruit le bateau
    destroyShip(){
        this.tilesDestroyedIndex = this.TilesIndex;
    }



    //Pour savoir si la position du bateau est valide (valide quand il a la place dans l'emplacement du tableau choisi selon son orientation, et qu'il n'est pas collé à un autre bateau)
    isShipFree(GameMap, Headindex) {
        let j = 0;
        switch (this.orientation) {
            case "D":
                for (let i = 1; i <= this.size; i++) {
                    switch(i){
                        case 1://Pour la tête
                            //On vérifie les 3 cases au dessus, à droite et à gauche
                            if(GameMap[Headindex - 1 - 10] != "V" || GameMap[Headindex - 10] != "V" || GameMap[Headindex + 1 - 10] != "V" || GameMap[Headindex - 1] != "V" || GameMap[Headindex + 1] != "V"){
                                return false;
                            }
                            break;
                        case this.size://Pour la queue du bateau
                            //On vérifie la case a droite et la case à gauche, puis les trois cases en dessous
                            if(GameMap[Headindex + j - 1 + 10] != "V" || GameMap[Headindex + j + 10] != "V" || GameMap[Headindex + j + 1 + 10] != "V" || GameMap[Headindex + j - 1] != "V" || GameMap[Headindex + j + 1] != "V"){
                                return false;
                            }
                            break;
                        default://Pour une partie intérieure du bateau (=ni la tête ni la queue)
                            //On vérifie la case à droite et la case à gauche
                            if(GameMap[Headindex + j - 1] != "V" || GameMap[Headindex + j + 1] != "V"){
                                return false;
                            }
                    }
                    j += 10; //10 = taille d'une carte de bataille navale
                }
                return true;

            case "R":
                for (let i = 1; i <= this.size; i++) {
                    switch(i){
                        case 1://Pour la tête
                            //On vérifie les trois cases à gauche, la case au dessus et la case en dessous, et on vérifie que le bateau ne va pas changer de ligne de tableau (=qu'il ne soit pas coupé entre deux lignes)
                            if(GameMap[Headindex - 1 - 10] != "V" ||  GameMap[Headindex - 1] != "V" || GameMap[Headindex - 1 + 10] != "V" ||  GameMap[Headindex - 10] != "V" || GameMap[Headindex + 10] != "V" || GameMap[Headindex + 1] != "V" || (Headindex + 1) % 10 == 0){
                                return false;
                            }
                            break;
                        case this.size://Pour la queue
                            //On vérifie les trois cases à droite, la case au dessus et la case en dessous
                            if(GameMap[Headindex + j - 10] != "V" || GameMap[Headindex + j + 10] != "V" || GameMap[Headindex + j + 1 + 10] != "V" || GameMap[Headindex + j + 1] != "V" || GameMap[Headindex + j + 1 - 10] != "V"){
                                return false;
                            }
                            break;
                        default://Pour une partie intérieure
                            //On vérifie la case au dessus et la case en dessous, et on vérifie que le bateau ne va pas changer de ligne de tableau (=qu'il ne soit pas coupé entre deux lignes)
                            if(GameMap[Headindex + j - 10] != "V" || GameMap[Headindex + j + 10] != "V" || GameMap[Headindex + 1] != "V" || (Headindex + j + 1) % 10 == 0){
                                return false;
                            }
                    }
                    j += 1; //1 = case de droite
                }
                return true;
        }
    }
}

//Exporte la classe bateau
module.exports = ship;