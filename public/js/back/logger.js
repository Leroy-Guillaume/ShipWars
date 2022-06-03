let logger = (function(){

    function postLog(username, password) {
        console.log(username, password);
        $.ajax({
            type: "POST",
            url: "/login/",
            data: {
                login: username,
                password: password
            },
            success: () => {
                window.location.href = "/";
            },
        });
    }

    return {
        sendLogin(username, password) {
            postLog(username, password);
        }
    }
})();

let Rlogger = (function(){

    function postRegi(Rusername, Rpassword, Rpassword2) {
        console.log(Rusername, Rpassword, Rpassword2);
        $.ajax({
            type: "POST",
            url: "/register/",
            data: {
                Rlogin: Rusername,
                Rpassword: Rpassword,
                Rpassword2: Rpassword2
            },
            success: () => {
                window.location.href = "/";
            },
        });
    }

    return {
        sendRegi(Rusername, Rpassword, Rpassword2) {
            postRegi(Rusername, Rpassword, Rpassword2);
        }
    }
})();