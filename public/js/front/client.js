const socket = io.connect();
let view = new shipWarsView();


$(function() {
    //Connecté au serveur
    socket.on('connect', function() {
      console.log('Connected to server.');
      view.resetGraph();
      $('#disconnected').hide();
      $('#waiting-room').show();   
    });
  
    //Déconnecté du serveur
    socket.on('disconnect', function() {
      console.log('Disconnected from server.');
      view.resetGraph();
      $('#waiting-room').hide();
      $('#game').hide();
      $('#disconnected').show();
    });
  
    
    //Un utilisateur a rejoint la partie
    socket.on('join', function(gameId) {
      view.resetGraph();
      $('#disconnected').hide();
      $('#waiting-room').hide();
      $('#game').show();
      $('#game-number').html(gameId);
    })
  
    //Mise a jour du tour de jeu
    socket.on('update', function(selfGrid, opponentGrid, player, playerTurn) {
      view.setTurn(player, playerTurn);
      view.updateGrids(selfGrid, opponentGrid);
      view.linkTabToGraph();
    });

    socket.on('weaponUsed', function(weapon){
      view.weaponHasBeenUsed(weapon);
    })
  
    //Fin de partie 
    socket.on('gameover', function(player, winner) {
      let isWinner;
      if(player == winner){
        isWinner = true;
      }
      else{
        isWinner = false;
      }
      view.setGameOver(isWinner);
    });
    
    //Quitter la partie et retour en file d'attente
    socket.on('leave', function() {
      $('#game').hide();
      $('#waiting-room').show();
    });
  
    
  
  });
  
  //Envoie de la requête de quitter la partie (bouton de fin pour retourner en file d'attente)
  function sendLeaveRequest(e) {
    e.preventDefault();
    socket.emit('leave');
  }
  
  //Envoie des coordonnées du tir au serveur
  function sendShot(index) {
    socket.emit('shot', index);
  }

  //Change l'arme du joueur
  function changeWeapon(weapon) {
    socket.emit('changeWeapon', weapon);
}
  