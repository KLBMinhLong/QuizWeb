global.__basedir = __dirname;
var bodyParser = require("body-parser");
var express = require("express");
var cookieParser = require("cookie-parser");
var app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Static
app.use("/static", express.static(__dirname + "/public"));

// Controllers
var controller = require(__dirname + "/apps/controllers");
app.use(controller);

// Views
app.set("views", __dirname + "/apps/views");
app.set("view engine", "ejs");

// Start server
var server = app.listen(3000, function () {
  console.log("server is running on port 3000: http://localhost:3000");
});



