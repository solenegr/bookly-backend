require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const booksRouter = require("./routes/books");
const challengesRouter = require("./routes/challenges");
const messagesRouter = require("./routes/messages");
const conversationsRouter = require("./routes/conversations");
const reviewRouter = require("./routes/reviews");
const libraryRouter = require("./routes/libraries");
const pusherRouter = require("./routes/pusher");
const app = express();
const cors = require("cors");
app.use(cors());

// 🔥 Import des modèles au démarrage
require("./models/books");
require("./models/libraries");

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
app.use("/reviews", reviewRouter);
app.use("/libraries", libraryRouter);
app.use("/pusher", pusherRouter);
module.exports = app;
