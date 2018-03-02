var cognitoUser;

function _makeAWSCredentials(idToken) {
    var someVar = 'cognito-idp.' + awsConfig.regionName + '.amazonaws.com/' + awsConfig.userPoolId;
    return new AWS.CognitoIdentityCredentials({
        IdentityPoolId: awsConfig.identityPoolId,
        Logins: {
            [someVar]: idToken
        }
    });
}


function _makeUserPool() {
    var poolData = {
        UserPoolId: awsConfig.userPoolId,
        ClientId: awsConfig.clientId
    };
    return new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
}



function init() {
    AWS.config.region = awsConfig.regionName;


    // Load cognito User from local storage
    var userPool = _makeUserPool();
    cognitoUser = userPool.getCurrentUser();

    // If not Found, show login page
    if (cognitoUser == null) {
        showLoginDiv(true);
        showMenuDiv(false);
        return;
    }


    // Load Session from Local storage if found
    cognitoUser.getSession(function(err, session) {
        if (err) {
            alert(err);
            return;
        }

        console.log('session validity: ' + session.isValid());
        console.log('ID Token: ' + session.idToken.jwtToken);

        // Set Credentials within AWS Config to access other AWS services
        var idToken = session.idToken.jwtToken;
        AWS.config.credentials = _makeAWSCredentials(idToken);
        console.log(AWS.config.credentials)

        // Refresh the credentials - in case the session has expired
        AWS.config.credentials.get(function(err) {
            if (err) {
                alert(err);
            }
        });
    });
    _enableMfa();
    // if user is logged IN, show Menu
    showMenuDiv(true);
    showLoginDiv(false);
}


function checkHash(hash, newHash, userName, password) {
    if (hash === newHash) {
        _loginToAWS(userName, password);
    } else {
        showUnauthorizedMenuDiv(true);
        showUnauthMenuDiv(false);
        showUnauthLoginDiv(false);
        showAuthLoginDiv(false);
        showAuthMenuDiv(false);
    }

}

function getUrlHash(url) {
    if (!url) url = window.location.href;
    var hashurl = url.split("&hash=");
    var mylasturl = hashurl[1];
    var mynexturl = mylasturl.split("&");
    var hash = mynexturl[0];
    return hash;
}

function onLogin() {
    var auth = getParameterByName('auth');
    var userNameFld = document.getElementById('userName');
    var userName = userNameFld.value;
    var passwordFld = document.getElementById('password');
    var password = passwordFld.value;
    var key = getParameterByName('key');
    if (auth == 'true' || auth == 'false') {
        var hash = getUrlHash();
        var newHash = createHmac(userName, key);
        console.log("oldHash: ", hash);
        console.log("newHash: ", newHash);
        checkHash(hash, newHash, userName, password);
    } else {
        clearLoginError();
        disableButton('loginButton');

        if (userNameFld === null || passwordFld === null) {
            alert('Programmatic Error. User Name or Password Field is not configured properly');
            return;
        }

        // Now Login to AWS
        _loginToAWS(userName, password);
    }
}



function _loginToAWS(userName, password) {
    var userPool = _makeUserPool();
    var userData = {
        Username: userName,
        Pool: userPool
    };
    cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

    var authenticationData = {
        Username: userName,
        Password: password,
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);


    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: _callbackOnAWSLoginSuccess,
        onFailure: _callbackOnAWSLoginFailure,
        newPasswordRequired: _callbackOnAWSForcePasswdChange,
        mfaRequired: function(codeDeliveryDetails) {
            var verificationCode = prompt('Please input verification code sent via SMS', '');
            cognitoUser.sendMFACode(verificationCode, this);
        }
    });

}


function _callbackOnAWSLoginSuccess(result) {
    console.log('access token + ' + result.getAccessToken().getJwtToken());
    /*Use the idToken for Logins Map when Federating User Pools with Cognito Identity or when passing through an Authorization Header to an API Gateway Authorizer*/
    console.log('idToken + ' + result.idToken.jwtToken);

    idToken = result.idToken.jwtToken;
    AWS.config.credentials = _makeAWSCredentials(idToken);

    var auth = getParameterByName('auth');

    setTimeout(function() {
        enableButton('loginButton', 'Sign in');

        if (auth == 'true' || auth == 'false') {
            showUnauthMenuDiv(false);
            showUnauthLoginDiv(false);
            showAuthLoginDiv(false);
            showAuthMenuDiv(true);
            showUnauthorizedMenuDiv(false);
            text = '<button onclick="downloadObject()">Download File</button>'
            document.getElementById("output").innerHTML = text
        } else {
            showMenuDiv(true);
            showLoginDiv(false)
        }

    }, 100);
}



function _callbackOnAWSLoginFailure(err) {
    console.log("Failure: ");
    setLoginErrorMessge(err);
    enableButton('loginButton', 'Sign in');
}



// TODO: Improve this by asking for modified password
function _callbackOnAWSForcePasswdChange(userAttributes, requiredAttributes) {
    // User was signed up by an admin and must provide new
    // password and required attributes, if any, to complete
    // authentication.

    // userAttributes: object, which is the user's current profile. It will list all attributes that are associated with the user.
    // Required attributes according to schema, which don’t have any values yet, will have blank values.
    // requiredAttributes: list of attributes that must be set by the user along with new password to complete the sign-in.

    console.log('User Attributes: ' + userAttributes);
    console.log('Required Attributes: ' + requiredAttributes);

    // Get these details and call
    // newPassword: password that user has given
    // attributesData: object with key as attribute name and value that the user has given.
    cognitoUser.completeNewPasswordChallenge('password123', {}, this)
}




function onLogout() {
    if (cognitoUser == null) {
        alert('user not logged in');
        return;
    }

    cognitoUser.signOut();
    cognitoUser = null;
    showLoginDiv(true);
    showMenuDiv(false);
    console.log('Signed Out');
}

function registerinit() {
    showMenuDiv(false);
    showLoginDiv(true);
    document.getElementById("register").disabled = true;
}

function register() {
    var userPool = _makeUserPool();

    var attributeList = [];

    var usernameFld = document.getElementById('unauthUsername');
    var username = usernameFld.value;

    var passwordFld = document.getElementById('unauthPassword');
    var password = passwordFld.value;

    var phoneFld = document.getElementById('unauthPhone');
    var phone = phoneFld.value;

    var dataEmail = {
        Name: 'email',
        Value: username
    };
    var dataPhoneNumber = {
        Name: 'phone_number',
        Value: phone
    };
    var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataPhoneNumber);

    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);

    userPool.signUp(username, password, attributeList, null, function(err, result) {
        if (err) {
            alert(err);
            return;
        }
        cognitoUser = result.user;
        console.log('user name is ' + cognitoUser.getUsername());

    });
}

function confirmUser() {
    var usernameFld = document.getElementById('unauthUsername');
    var username = usernameFld.value;
    var codeFld = document.getElementById('confirmcode');
    console.log(codeFld);
    var code = codeFld.value;
    console.log("username: ", username);
    console.log("code: ", code);
    var userPool = _makeUserPool();
    var userData = {
        Username: username,
        Pool: userPool
    };

    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            alert(err);
            return;
        }
        console.log('call result: ' + result);
    });
    showUnauthLoginDiv(false);
    showUnauthMenuDiv(false);
    showAuthLoginDiv(true);
    showAuthMenuDiv(false);
    showUnauthorizedMenuDiv(false);
}

function _enableMfa() {
    cognitoUser.enableMFA(function(err, result) {
        if (err) {
            alert(err);
            return;
        }
        console.log('call result: ' + result);
    });
}

function authenticateLogin() {
    showUnauthLoginDiv(false);
    showUnauthMenuDiv(false);
    showAuthLoginDiv(true);
    showAuthMenuDiv(false);
}


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function authenticationInit() {
    var auth = getParameterByName('auth');
    console.log(auth);
    if (auth == 'false') {
        showUnauthLoginDiv(true);
        showUnauthMenuDiv(false);
        showAuthLoginDiv(false);
        showAuthMenuDiv(false);
        showUnauthorizedMenuDiv(false);
    }
    if (auth == 'true') {
        showUnauthLoginDiv(false);
        showUnauthMenuDiv(false);
        showAuthLoginDiv(true);
        showAuthMenuDiv(false);
        showUnauthorizedMenuDiv(false);
    }
}
