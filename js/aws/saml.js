function init() {
    AWS.config.update({
        region: 'us-east-1'
    });
    var sts = new AWS.STS();
    var cognitoidentity = new AWS.CognitoIdentity();
    var url = document.location.href;
    const identityPoolId = awsConfig.identityPoolId;
    var saml = getParameterByName('SAMLResponse');

    var login = {}
    login[awsConfig.samlIdpArn] = saml;
    console.log(login);

    var params = {
        IdentityPoolId: identityPoolId,
        Logins: login
    };
    cognitoidentity.getId(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log("Identity ID: ", data.IdentityId); // successful response
            identityId = data.IdentityId;
            getCredentials(cognitoidentity, identityId, login);
            AWS.config.credentials.get(function(err) {
                if (err) {
                    alert(err);
                }
            });
            showMenuDiv(false);
            showLoginDiv(true)
        }
    });

}

function getCredentials(cognitoidentity, identityId, login) {
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: awsConfig.identityPoolId,
        Logins: login
    });
    var params = {
        Logins: login,
        IdentityId: identityId
    };
    cognitoidentity.getCredentialsForIdentity(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data); // successful response
            AWS.config.credentials.accessKeyId = data.Credentials.AccessKeyId;
            AWS.config.credentials.secretAccessKey = data.Credentials.SecretKey;
            AWS.config.credentials.sessionToken = data.Credentials.SessionToken;
        }
    });

}

function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function adLogin() {
    console.log("Redirecting to ADFS Login Page");
    var RPID = encodeURIComponent(awsConfig.relayingPartyId);
    var result = awsConfig.adfsUrl + "?loginToRp=" + RPID;
    sessionStorage.setItem('activelogin', 'inProgress');
    window.location = result;
}


function adLogout() {
    console.log("Signing Out");
    var result = awsConfig.adfsLogoutUrl;
    sessionStorage.setItem('activelogin', 'null');
    window.location = result;
}
