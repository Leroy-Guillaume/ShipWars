# Shipwars

Jeu de la bataille navale avec des armes différentes. Projet de fin de semestre 2 de CIR2.<br/>
Par Aurélien Rogé, Guillaume Leroy, Marco Fordelone, Théophile Demeulier et Théo Vangheluwe.

## Installation

Étape 1: Télécharger/cloner.
```
git clone https://github.com/AurelienRoge/ShipWars
```
Étape 2: Installer les dependances.
```
npm install
```
Étape 3: Lancer/créer votre base de données en utilisant un outil tel que XAMPP (ou autre).<br/>
Étape 3.5 : Créer la base de données :<br/>
<br/>
Par défaut le SQL fonctionne avec une base de données avec ces paramètres :<br/>
user / mdp : par défaut<br/>
nom de la base : "batnav"<br/>
nom du tableau : "tab"<br/>
<br/>
le tableau a 3 colonnes : User / MDP / NbVic <br/>
<br/>
Étape 4: Lancer le serveur.
```
node server.js
```
Étape 5: Ouvrir http://localhost:4200/ dans votre navigateur pour jouer et accéder au site.
