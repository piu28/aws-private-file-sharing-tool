<!-- UI Related Function -->
function showMenuDiv (display) {
    var e = document.getElementById('menuDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}

function showLoginDiv (display) {
    var e = document.getElementById('loginDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}


function setLoginErrorMessge (err) {
    var errorFld = document.getElementById ('loginErrMsg');
    errorFld.innerHTML = err.message;
}


function clearLoginError () {
    var errorFld = document.getElementById ('loginErrMsg');
    errorFld.innerHTML = '&nbsp;';
}


function disableButton (buttonName) {
    var aButton = document.getElementById (buttonName);
    aButton.disabled=true;
    aButton.innerHTML = "<img src='images/loading.gif'/>";
}


function enableButton (buttonName, buttonText) {
    var aButton = document.getElementById (buttonName);
    aButton.disabled=false;
    aButton.innerHTML = buttonText;
}

function showAuthMenuDiv (display) {
    var e = document.getElementById('authmenuDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}

function showAuthLoginDiv (display) {
    var e = document.getElementById('authloginDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}

function showUnauthMenuDiv (display) {
    var e = document.getElementById('unauthmenuDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}

function showUnauthLoginDiv (display) {
    var e = document.getElementById('unauthloginDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}

function showUnauthorizedMenuDiv (display) {
    var e = document.getElementById('unauthorizedMenuDiv');
    if (display)
        e.style.display = 'block';
    else
        e.style.display = 'none';
}
