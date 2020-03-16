const express = require("express");
const app = express();
const dotenv = require('dotenv');
dotenv.config();

var Airtable = require('airtable');

// const AirGantt = require('./airgantt.js');
let base = new Airtable({apiKey: process.env.AIRTABLE}).base('appq8nALYBhLsFKeZ');

// make all the files in 'public' availables
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// https://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// send the default array of dreams to the webpage
app.get("/tasks", (request, response) => {
  let tasks = [];
  base('Task').select({
    view: "Main view",
    maxRecords: 3,
  }).eachPage(function page(records, fetchNextPage) {
      // This function (`page`) will get called for each page of records.

      records.forEach(function(record) {
        tasks.push({ID: record.id, ...record.fields});
      });

      fetchNextPage();

  }, function done(err) {
      response.json(tasks);
      if (err) { console.error(err); return; }
  });
});

// listen for requests :)
const listener = app.listen(8080, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
