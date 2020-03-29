require("dotenv").config();

const TwitchBot = require("twitch-bot"),
  express = require("express"),
  bodyParser = require("body-parser"),
  app = express(),
  path = require("path"),
  { USER_NAME, USER_OAUTH, PORT, CHANNEL } = process.env;
let nowPlaying,
  set = [],
  requests = [];
const Bot = new TwitchBot({
  username: USER_NAME,
  oauth: USER_OAUTH,
  channels: [CHANNEL]
});

Bot.on("join", channel => {
  console.log(`Joined channel: ${channel}`);
});

Bot.on("error", err => {
  console.log(err);
});

Bot.on("message", chatter => {
  if (chatter.message.indexOf("!help") > -1) {
    Bot.say("!help, !request, !playing");
  }
  if (chatter.message.indexOf("!set") > -1) {
    if (set.length > 0) {
      let setlist = "Setlist: ";
      set.forEach(title => {
        setlist = setlist + title.trim() + ", ";
      });
      Bot.say(setlist.slice(0, -2) + ".");
    } else {
      Bot.say("No set list yet.");
    }
  }
  if (chatter.message.indexOf("!playing") > -1) {
    if (typeof nowPlaying != "undefined") {
      Bot.say(`Now playing ${nowPlaying}`);
    } else {
      Bot.say("not playing anything yet");
    }
  }
  if (chatter.message.indexOf("!request") > -1) {
    const followup = chatter.message.substring(
      chatter.message.indexOf("!request") + 9
    );
    requests.push(followup);
    Bot.say(`Request for ${followup} submitted`);
  }
});
app.set("view engine", "ejs");
app.use("/public/", express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.render("index", { set, requests });
});
app.post("/message", (req, res) => {
  res.redirect("/");
  Bot.say(req.body.message);
});
app.post("/", (req, res) => {
  const { playing } = req.body;
  nowPlaying = playing;
  if (
    typeof playing != "undefined" &&
    set.slice(-1)[0] != playing &&
    playing != ""
  ) {
    Bot.say(`Now playing ${playing}`);
    set.push(playing);
  }
  res.render("index", { playing, set, requests });
});
app.get("/delete::id", (req, res) => {
  requests.splice(requests.indexOf(req.params.id), 1);
  res.redirect("/");
});
app.get("/reject::id", (req, res) => {
  Bot.say(`Not playing ${req.params.id}`);
  requests.splice(requests.indexOf(req.params.id), 1);
  res.redirect("/");
});
app.get("/none::id", (req, res) => {
  Bot.say(`I don't have ${req.params.id}`);
  requests.splice(requests.indexOf(req.params.id), 1);
  res.redirect("/");
});
app.get("/whoops::id", (req, res) => {
  set.splice(set.indexOf(req.params.id), 1);
  res.redirect("/");
});
app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
