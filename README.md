# Air Gantt

Air Gantt pulls (gantt-like) data from an Airtable database table, via the API, and represents it as a force-directed graph using d3js. No build tools required.

## Server Side

The server pulls data in from the Airtable API and returns all contents of the "Tasks" table.

The Airtable API key goes in a `.env` file.

## Airtable

Airtable is a "spreadsheet-database hybrid." Kind of like Microsoft Access in the cloud. I enjoy managing projects by structuring data in an Airtable database, but I wanted more powerful view and input capabilities.

You can see below that I have a table named _Tasks_, a view named _API_ and a link to other records in the table called _PreReqs_.

![airtable screenshot](https://samgates.dev/wp-content/uploads/2020/03/screenshot_airtable.png")

## Frontend

D3js processes the tasks using a number of [forceSimulation](https://github.com/d3/d3-force) features, defined by data on the nodes/tasks themselves (node depth, priority, etc.)

<ol>
<li>Task Depth is scaled (logarithmically) along the x-axis</li>
<li>Task Priority is scaled along the y-axis</li>
<li>Task circle area is relative to the estimated duration of the task</li>
<li>Task's are color-coded by type</li>
</ol>

![air gantt screenshot](https://samgates.dev/wp-content/uploads/2020/03/screenshot_graph.png)

## Use

Controls are more or less as specified by [rkirsling](http://bl.ocks.org/rkirsling/5001347)'s, whose source script I adapted for this project.

## Future Features

The interactivity is mostly cosmetic, so in the near future, I'd like to be able to do more than just READ from Airtable. That said, you can still just update Airtable then refresh your screen.

## Make your own
Airtable API documentation is pretty easy to follow, just a matter of entering your API key and changing any table, column, or view names to those in the script. All the syntax is in `server.js` and the `buildGraph()` function in `script.js`.

Email **samirillion at protonmail dot com** to get a copy of the Airtable database I am using. The fields are the same as those in the database, as you can see in `script.js`

```
    nodes.push({
      id: task.ID,
      name: task.Name,
      time: task.Duration
      ...
    }
```
