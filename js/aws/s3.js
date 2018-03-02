function _makeUserPool() {
    var poolData = {
        UserPoolId: awsConfig.userPoolId,
        ClientId: awsConfig.clientId
    };
    return new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}

function checkPassword() {
    // at least one number, one lowercase and one uppercase letter
    // at least six characters
    var passwordFld = document.getElementById('unauthPassword');
    var password = passwordFld.value;
    var re = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
    test = re.test(password);
    if (test == false)
        alert("Specify a minimum password length of at least 8 characters, as well as include uppercase, numeric, and special characters");
}

function validatePassword() {
    var password = document.getElementById("unauthPassword").value;
    var confirmPassword = document.getElementById("unauthConfirmPassword").value;
    if (password != confirmPassword) {
        alert("Passwords do not match.");
        return false;
    }
    document.getElementById("register").disabled = false;
    return true;
}

function showS3BucketContents() {
    disableButton('viewS3BucketButton')
    var prefixFld = document.getElementById('bucketPrefix');
    var prefix = prefixFld.value;

    var userPool = _makeUserPool();
    cognitoUser = userPool.getCurrentUser();
    console.log(cognitoUser.username);


    if (prefix === '') {
        _showResultOnPopup("Please specify Prefix");
        return;
    }

    if (prefix === cognitoUser.username || prefix === 'shared') {
        _showS3BucketContents(prefix);
    } else {
        enableButton('viewS3BucketButton', 'View Contents')
        alert("Access Denied!! Please specify your correct folder name!!");
    }
}

function formatBytes(bytes, decimals) {
    if (bytes == 0) return '0 Bytes';
    var k = 1000,
        dm = decimals || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function _showS3BucketContents(prefix) {
    var bucket = awsConfig.bucket;
    var bucket = new AWS.S3({
        params: {
            Bucket: bucket,
            Prefix: prefix
        }
    });
    var textToDisplay = '';
    var text = '';
    var checkbox = '';
    bucket.listObjects({}, function(err, data) {
        var textToDisplay = "";

        if (err) {
            textToDisplay = 'ERROR While Fetching Bucket List\n\n' + err;
        } else {
            var count = 0;
            data.Contents.forEach(function(obj) {
                size = obj.Size
                formattedsize = formatBytes(size)
                text = '<a href="javascript:document.location.href=downloadLink(' + "'" + obj.Key + "'" + ')";>' + obj.Key + "</a>" + " " + formattedsize + "<br>"
                checkbox = '<input type="checkbox" id="check' + count + '" onclick=onClickHandler(); value="' + obj.Key + '" >'
                textToDisplay += checkbox + " " + text
                console.log(textToDisplay);
                count++;
                if (count >= 10) {
                    return;
                }
            });

            if (count == 0)
                textToDisplay = "You haven't uploaded anything yet.";
            else
                textToDisplay = "Files in S3 Bucket (upto 10 only): <br>" + textToDisplay;
        }

        _showResultOnPopup(textToDisplay);
    });
    return textToDisplay;
}


function _showResultOnPopup(textToDisplay) {
    enableButton('viewS3BucketButton', 'View Contents')
    document.getElementById("output").innerHTML = textToDisplay
}

function uploadToS3() {
    disableButton('uploadToS3')
    var bucket = 'private-cognito-s3';

    var prefixFld = document.getElementById('bucketPrefix');
    var prefix = prefixFld.value;
    uploadLocation = bucket + "/" + prefix
    console.log(uploadLocation);

    var bucket = new AWS.S3({
        params: {
            Bucket: bucket
        }
    });


    var files = document.getElementById('photoupload').files;
    if (!files.length) {
        return alert('Please choose a file to upload first.');
    }
    var file = files[0];

    var params = {
        Bucket: uploadLocation,
        Key: file.name,
        Body: file
    };

    bucket.upload(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            alert("Error Occurred \n\n" + err);
        } else {
            console.log(data.key + ' Uploaded at ' + data.Location);
            alert(data.key + ' Uploaded at ' + data.Location);
        }

        enableButton('uploadToS3', 'Upload');
    });
}

function downloadLink(key) {
    urlToDisplay = '';
    bucket = 'private-cognito-s3'
    var prefixFld = document.getElementById('bucketPrefix');
    var prefix = prefixFld.value;

    var bucket = new AWS.S3({
        params: {
            Bucket: bucket,
            Key: key
        }
    });
    bucket.getSignedUrl('getObject', {}, function(err, signedurl) {
        if (err) console.log(err)
        else {
            console.log('The URL is', signedurl);
            urlToDisplay = signedurl
        }
    });
    return urlToDisplay;
}

var urlToDisplay = '';

function downloadObject() {
    AWS.config.region = awsConfig.regionName;
    var url = document.location.href,
        params = url.split('?')[1].split('&'),
        data = {},
        tmp;
    for (var i = 0, l = params.length; i < l; i++) {
        tmp = params[i].split('=');
        data[tmp[0]] = tmp[1];
    }
    bucketName = data.bucketname;
    key = data.key;
    console.log("downloading " + key + " from " + bucketName);
    var bucket = new AWS.S3({
        params: {
            Bucket: bucketName,
            Key: key
        }
    });
    bucket.getSignedUrl('getObject', {}, function(err, signedurl) {
        if (err) console.log(err)
        else {
            console.log('The URL is', signedurl);
            urlToDisplay = signedurl
            window.location.replace(urlToDisplay);
        }
    });
    return urlToDisplay;
}

function copyObject(to) {
    var prefixFld = document.getElementById('bucketPrefix');
    var prefix = prefixFld.value;
    for (index = 0; index < x.length; ++index) {
        file = document.getElementById(x[index]).value;
        sourceFile = "/" + awsConfig.bucket + "/" + file;
        destFile = awsConfig.bucket + "/" + to;
        console.log(destFile);
        var bucket = new AWS.S3({
            params: {
                Bucket: destFile,
                CopySource: sourceFile,
                Key: file
            }
        });
        bucket.copyObject(function(err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else console.log(data);
        });
    }
}

function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


var x = [];

function onClickHandler() {
    if (document.getElementById(onClickHandler.caller.arguments[0].target.id).checked == true) {
        x.push(onClickHandler.caller.arguments[0].target.id)
        return x
    }
}


function checkEmail() {
    disableButton('sendemail')
    var toFld = document.getElementById('toaddress');
    var to = toFld.value;

    if (to === '') {
        err = "Please specify your email address";
        document.getElementById("emailoutput").innerHTML = err;
        enableButton('sendemail', 'Send Email');
        return;
    }
    if (validateEmail(to) == true) {
        checkUser(to);
    } else {
        error = "Please provide correct Email Address"
        document.getElementById("emailoutput").innerHTML = error
    }
    copyObject(to);
    enableButton('sendemail', 'Send Email');
}

function checkUser(email) {
    var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
    var params = {
        UserPoolId: awsConfig.userPoolId,
        Username: email
    };
    var emailsent = "Email Sent";
    cognitoidentityserviceprovider.adminGetUser(params, function(err, data) {
        if (err) { //console.log(err, err.stack);
            sendEmailUnauthenticate(email);
            document.getElementById("emailoutput").innerHTML = emailsent;
        } else {
            sendEmailAuthenticate(email);
            document.getElementById("emailoutput").innerHTML = emailsent;
        }
    });
}

function createHmac(to, file) {
    var string = to + "+" + file;
    console.log("Key to be encrypted: ", string)
    var hash = CryptoJS.HmacSHA256(string, "secretpuc");
    var hashInBase64 = CryptoJS.enc.Base64.stringify(hash);
    console.log("hashInBase64: ", hashInBase64);
    return hashInBase64;
}

function sendEmailAuthenticate(to) {
    var sendFile = '';
    bucket = 'private-cognito-s3'
    for (index = 0; index < x.length; ++index) {
        file = document.getElementById(x[index]).value;
        var hashInBase64 = createHmac(to, file);
        sendFile += "- <a class=\"ulink\" href=\"https://cognito.powerupcloud.com/authenticated.html?auth=true&bucketname=" + bucket + "&key=" + file + "&user=" + to + "&hash=" + hashInBase64 + "\" target=\"_blank\">" + file + "</a><br>"
        console.log(sendFile)
    }
    AWS.config.region = awsConfig.regionName;

    var ses = new AWS.SES({
        params: {
            Destination: {
                ToAddresses: [
                    to,
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: "Click on the link below to download the file:<br>" + sendFile
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Download the File"
                }
            },
            Source: "powerops@powerupcloud.com"
        }
    });
    ses.sendEmail({}, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
    });
}

function sendEmailUnauthenticate(to) {
    var sendFile = '';
    bucket = 'private-cognito-s3'
    for (index = 0; index < x.length; ++index) {
        file = document.getElementById(x[index]).value;
        var hashInBase64 = createHmac(to, file);
        sendFile += "- <a class=\"ulink\" href=\"https://cognito.powerupcloud.com/authenticated.html?auth=false&bucketname=" + bucket + "&key=" + file + "&user=" + to + "&hash=" + hashInBase64 + "\" target=\"_blank\">" + file + "</a><br>"
    }
    var ses = new AWS.SES({
        params: {
            Destination: {
                ToAddresses: [
                    to,
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: "Click on the link below to download the file:<br>" + sendFile
                    }
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: "Download the File"
                }
            },
            Source: "powerops@powerupcloud.com"
        }
    });
    ses.sendEmail({}, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
    });
}
