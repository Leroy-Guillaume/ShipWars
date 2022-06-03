//forms
let formLog = document.getElementById('loginForm');
let formReg = document.getElementById('registerForm');
//log
let input = document.getElementById('username');
let inputM = document.getElementById('password');
//reg
let Rinput = document.getElementById('Rusername');
let RinputM = document.getElementById('Rpassword');
let RinputM2 = document.getElementById('Rpassword2');

// Envoi du log
formLog.addEventListener('submit', event => {
    event.preventDefault();
    console.log("submit client ok");
    logger.sendLogin(input.value, inputM.value);
});

// Envoi du reg
formReg.addEventListener('submit', event => {
    event.preventDefault();
    console.log("submit R client ok");
    Rlogger.sendRegi(Rinput.value, RinputM.value, RinputM2.value);
});