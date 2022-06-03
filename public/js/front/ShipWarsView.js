class shipWarsView {
    constructor() {

        this.gridThisPlayer = new Array(100);

        this.gridFromOpponent = new Array(100);

        for (let i = 0; i < 100; i++) {
            this.gridThisPlayer[i] = "V";
        }
        for (let i = 0; i < 100; i++) {
            this.gridFromOpponent[i] = "V";
        }

        //On récupère les tableaux de l'html
        this.tabThisPlayer = new Array();
        for (let i = 0; i < 100; i++) {
            this.tabThisPlayer.push(document.getElementById("gametablePlayer0").getElementsByClassName("gametile")[i]);
        }
        this.tabOpponent = new Array();
        for (let i = 0; i < 100; i++) {
            this.tabOpponent.push(document.getElementById("gametablePlayer1").getElementsByClassName("gametile")[i]);
        }

        this.weaponButtons = new Array();
        for (let i = 0; i < 4; i++) {
            this.weaponButtons.push(document.getElementsByClassName("weaponBtn")[i])
        }


        //Initialisation des event listeners sur chaque case de chaque tableau
        this.EventListeners();
        this.linkTabToGraph();
    }


    //Pour ajouter les listeners de chaque case de chaque tableau
    EventListeners() {
        for (let i = 0; i < this.tabOpponent.length; i++) {
            this.tabOpponent[i].addEventListener('click', function () { sendShot(i) });
        }


        //Listeners des boutons des armes
        for (let i = 0; i < this.weaponButtons.length; i++) {
            this.weaponButtons[i].parent = this;
        }

        this.weaponButtons[0].addEventListener('click', function () { changeWeapon("Missile") });
        this.weaponButtons[1].addEventListener('click', function () { changeWeapon("Radar") });
        this.weaponButtons[2].addEventListener('click', function () { changeWeapon("Torpille") });
        this.weaponButtons[3].addEventListener('click', function () { changeWeapon("Bombe") });
    }

    //Fonction pour les actions du joueur 0 lorsqu'il clic sur une case du tableau adverse

    clickOnOpponentTabEvent(index) {
        sendShot(index);
    }

    //Mise à jour des grilles suite à un envoi du serveur
    updateGrids(selfGrid, opponentGrid) {
        this.gridThisPlayer = selfGrid;
        this.gridFromOpponent = opponentGrid;
    }

    //On supprime toutes les classes pour reset l'affichage (donc côté client)
    resetGraph() {
        this.weaponButtons[1].classList.remove("WeaponUsed");
        this.weaponButtons[2].classList.remove("WeaponUsed");
        this.weaponButtons[3].classList.remove("WeaponUsed");


        for (let i = 0; i < 100; i++) {
            this.tabThisPlayer[i].classList.remove("Boat");
            this.tabThisPlayer[i].classList.remove("Hit");
            this.tabThisPlayer[i].classList.remove("Missed");
            this.tabThisPlayer[i].classList.remove("RadarBoat");
            this.tabThisPlayer[i].classList.remove("RadarEmpty");
            this.tabThisPlayer[i].classList.remove("Sunked");
        }
        for (let i = 0; i < 100; i++) {
            this.tabOpponent[i].classList.remove("Hit");
            this.tabOpponent[i].classList.remove("Missed");
            this.tabOpponent[i].classList.remove("RadarBoat");
            this.tabOpponent[i].classList.remove("RadarEmpty");
            this.tabOpponent[i].classList.remove("Sunked");
        }

        $('#turn-status').removeClass('alert-your-turn').removeClass('alert-opponent-turn')
            .removeClass('alert-winner').removeClass('alert-loser');
    }

    //Fonction pour mettre à jour les textures
    linkTabToGraph() {

        for (let i = 0; i < 100; i++) {
            switch (this.gridThisPlayer[i]) {
                case "B":
                    this.tabThisPlayer[i].classList.add("Boat");
                    this.tabThisPlayer[i].classList.remove("RadarBoat");
                    this.tabThisPlayer[i].classList.remove("RadarEmpty");
                    break;
                case "R":
                    this.tabThisPlayer[i].classList.add("Missed");
                    this.tabThisPlayer[i].classList.remove("RadarBoat");
                    this.tabThisPlayer[i].classList.remove("RadarEmpty");
                    break;
                case "T":
                    this.tabThisPlayer[i].classList.add("Hit");
                    this.tabThisPlayer[i].classList.remove("RadarBoat");
                    this.tabThisPlayer[i].classList.remove("RadarEmpty");
                    break;
                case "BR":
                    this.tabThisPlayer[i].classList.add("RadarBoat");
                    break;
                case "VR":
                    this.tabThisPlayer[i].classList.add("RadarEmpty");
                    break;
                case "S":
                    this.tabThisPlayer[i].classList.add("Sunked");
                    this.tabThisPlayer[i].classList.remove("Hit");
                    this.tabThisPlayer[i].classList.remove("RadarBoat");
                    this.tabThisPlayer[i].classList.remove("RadarEmpty");
            }
        }
        for (let i = 0; i < 100; i++) {
            switch (this.gridFromOpponent[i]) {
                case "R":
                    this.tabOpponent[i].classList.add("Missed");
                    this.tabOpponent[i].classList.remove("RadarBoat");
                    this.tabOpponent[i].classList.remove("RadarEmpty");
                    break;
                case "T":
                    this.tabOpponent[i].classList.add("Hit");
                    this.tabOpponent[i].classList.remove("RadarBoat");
                    this.tabOpponent[i].classList.remove("RadarEmpty");
                    break;
                case "BR":
                    this.tabOpponent[i].classList.add("RadarBoat");
                    break;
                case "VR":
                    this.tabOpponent[i].classList.add("RadarEmpty");
                    break;
                case "S":
                    this.tabOpponent[i].classList.add("Sunked");
                    this.tabOpponent[i].classList.remove("Hit");
                    this.tabOpponent[i].classList.remove("RadarBoat");
                    this.tabOpponent[i].classList.remove("RadarEmpty");
            }
        }
    }





    //Affichage du message de fin de partie et apparition du bouton
    setGameOver(isWinner) {
        if (isWinner) {
            $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
                .addClass('alert-winner').html('You won! <a href="#" class="btn-leave-game">Play again</a>.');
        } else {
            $('#turn-status').removeClass('alert-opponent-turn').removeClass('alert-your-turn')
                .addClass('alert-loser').html('You lost. <a href="#" class="btn-leave-game">Play again</a>.');
        }
        $('.btn-leave-game').click(sendLeaveRequest);
    }

    //Affichage du message du tour du joueur
    setTurn(player, playerTurn) {
        let isTurn;
        player == playerTurn ? isTurn = true : isTurn = false;
        if (isTurn) {
            $('#turn-status').removeClass('alert-opponent-turn').addClass('alert-your-turn').html('It\'s your turn!');
        } else {
            $('#turn-status').removeClass('alert-your-turn').addClass('alert-opponent-turn').html('Waiting for opponent.');
        }
    };

    weaponHasBeenUsed(weapon){
        console.log("Weapon has been used");
        switch(weapon){
            case "Radar":
                this.weaponButtons[1].classList.add("WeaponUsed");
                break;
            
            case "Torpille":
                this.weaponButtons[2].classList.add("WeaponUsed");
                break;

            case "Bombe":
                this.weaponButtons[3].classList.add("WeaponUsed");
                break;
        }
    }
}
