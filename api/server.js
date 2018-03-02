//require the express nodejs module
var express = require('express'),
    //set an instance of exress
    app = express(),
    //require the body-parser nodejs module
    bodyParser = require('body-parser'),
    //require the path nodejs module
    path = require("path");

var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey = fs.readFileSync('/etc/nginx/ssl/cognito.powerupcloud.com.key', 'utf8');
var certificate = fs.readFileSync('/etc/nginx/ssl/cognito.powerupcloud.com.cer', 'utf8');
var saml = require('saml-encoder-decoder-js');
var xml2js = require('xml2js');


var credentials = {
    key: privateKey,
    cert: certificate
};
const querystring = require('querystring');
//support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
    extended: true
}));

//tell express that www is the root of our public web folder
app.use(express.static(path.join(__dirname, 'www')));

//tell express what to do when the /form route is requested
var username = ''

app.post('/form', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    //mimic a slow network connection
    setTimeout(function() {

        getUserName(req.body.SAMLResponse);
        console.log("Logged in User: ", username);
        const query = querystring.stringify({
            "SAMLResponse": req.body.SAMLResponse,
            "user": username
        });
        res.redirect('https://cognito.powerupcloud.com/viewcontents.html?' + query);

    }, 1000)
    //      console.log('you posted: SAMLResponse: ' + req.body.SAMLResponse);

});

function getUserName(SAMLResponse) {
    saml.decodeSamlPost(SAMLResponse, function(err, xml) {
        if (!err) {
            var parser = new xml2js.Parser();
            parser.parseString(xml.substring(0, xml.length), function(err, result) {
                var json = JSON.stringify(result);
                var str = JSON.parse(json)
                username = str['samlp:Response'].Assertion[0].AttributeStatement[0].Attribute[1].AttributeValue[0];
            });
        }
    });
    return username;
}
var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(3000);
httpsServer.listen(8443);
