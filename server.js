var express = require("express");
var fs = require("fs");
var https = require("https");

var options = {
  pfx: fs.readFileSync("ssl/cert.pfx"),
  passphrase: "password"
};

var app = express();
app.use('/barcode-memo', express.static('src'));
https.createServer(options, app).listen(8080);
