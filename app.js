require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var booksRouter = require("./routes/books");
var challengesRouter = require("./routes/challenges");
var messagesRouter = require("./routes/messages");
var conversationsRouter = require("./routes/conversations");
var app = express();
const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/books", booksRouter);
app.use("/challenges", challengesRouter);
app.use("/messages", messagesRouter);
app.use("/conversations", conversationsRouter);
module.exports = app;
