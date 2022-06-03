class Player{
    constructor(id){
        this.id = id;

        //Booléen permettant de savoir si le joueur a déjà utilisé chaque capacité spéciale -> False = non utilisé (donc disponible)
        this.radar = false;
        this.torpille = false;
        this.bombe = false;

        this.attackMode = "Missile";
    }

    //Renvoit l'id socket io du joueur
    getID(){
        return this.id;
    }

    //Vérifie si l'arme entrée en paramètre est utilisée ou pas
    weaponHasBeenUsed(weapon){
        switch(weapon){
            case "Radar":
                this.radar = true;
                break;
            
            case "Torpille":
                this.torpille = true;
                break;
            
            case "Bombe":
                this.bombe = true;
                break;
        }
    }

    //Permet de voir si l'arme a été utilisée
    getWeaponUsed(){
        return{
            radar : this.radar,
            torpille : this.torpille,
            bombe : this.bombe
        };
    }

    //Permet de voir si l'arme a été utilisée V2 (oui c'est un peu bete)
    isWeaponUsed(weapon){
        switch(weapon){
            case "Missile":
                return false; //On autorise tt le temps à tirer à l'arme de base
            case "Radar":
                return this.radar;
            
            case "Torpille":
                return this.torpille;
            
            case "Bombe":
                return this.bombe;
        }
    }

    //Obtenir l'arme du joueur
    getAttackMode(){
        return this.attackMode;
    }
    
    //Change l'arme du joueur
    changeAttackMode(newMode) {
        this.attackMode = newMode;
        console.log("Player " + this.id + "changed weapon to " + newMode);
    }
}

//Exporte la classe
module.exports = Player;