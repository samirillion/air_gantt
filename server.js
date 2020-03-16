const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();

const AirGantt = require('./airgantt.js');

const crv = new AirGantt(process.env.AIRTABLE);

let tasks = crv.tasks();

// make all the files in 'public' availables
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// send the default array of dreams to the webpage
app.get("/dreams", (request, response) => {
  // express helps us take JS objects and send them as JSON
  console.log(tasks);
  response.json(tasks);

});

// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
