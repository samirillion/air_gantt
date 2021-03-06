// original
//http://bl.ocks.org/rkirsling/5001347

// bounded box
// https://bl.ocks.org/mbostock/1129492

// anticollision
// https://bl.ocks.org/mbostock/3231298

// some fixed nodes
// https://stackoverflow.com/questions/10392505/fix-node-position-in-d3-force-directed-layout

// zoomable
// https://bl.ocks.org/puzzler10/4438752bb93f45dc5ad5214efaa12e4a

// more collision detection
// https://bl.ocks.org/d3indepth/9d9f03a0016bc9df0f13b0d52978c02f

// mult-foci force layout
// https://bl.ocks.org/mbostock/1804919

const width = 1500;
const height = 800;
const ganttScheme = [
  "#FCF3B0",
  "#87E0FF",
  "#FFB0B0",
  "#9b9eff",
  "gold",
  "grey",
  "pink",
  "brown",
  "slateblue"
];
const maxDepth = 7;

const depth_log_x = d3
  .scaleLog()
  .domain([1, maxDepth + 1])
  .range([0, width]);

const phase_log_y = d3
  .scaleLog()
  .domain([1, 5])
  .range([0, height]);

async function getTasks() {
  let tasks = await fetch("/tasks");
  let taskData = await tasks.json();
  return taskData;
}

async function buildGraph() {
  let tasks = await getTasks();
  let nodes = [];
  let links = [];

  tasks.forEach(task => {
    let prereqDepth = function(level, task_id) {
      let task = tasks.filter(obj => {
        return obj.ID === task_id;
      })[0];
      if (task && task.PreReqs && task.PreReqs.length > 0) {
        task.PreReqs.forEach(function(d) {
          if (level < maxDepth && task_id !== d) {
            level = prereqDepth(level + 1, d);
          }
        });
      }

      return level;
    };
    let area = task.Duration ? task.Duration : 3600;
    let radius = radiusFromArea(area);
    let depth = prereqDepth(0, task.ID);
    nodes.push({
      id: task.ID,
      reflexive: false,
      name: task.Name,
      time: task.Duration,
      color: task.Type ? task.Type[0] : "0",
      priority: task.Priority[0],
      prereqs: task.PreReqs ? task.PreReqs : [],
      radius,
      depth
    });
    if (task.PreReqs) {
      task.PreReqs.forEach(prereq => {
        links.push({
          source: prereq,
          target: task.ID,
          left: false,
          right: true
        });
      });
    }
  });

  return { lastNodeId: nodes[0].id, nodes, links };
}

function radiusFromArea(area = 3600) {
  return Math.sqrt(area / Math.PI / 2) + 5;
}

// wrap the entire thing here
buildGraph().then(res => {
  const nodes = res.nodes;
  let lastNodeId = res.lastNodeId;
  const links = res.links;

  const colors = d3.scaleOrdinal(ganttScheme);
  const depth_spectrum_x = d3
    .scaleLinear()
    .domain(d3.range(maxDepth))
    .range([0, width], 1);

  const svg = d3
    .select("body")
    .append("svg")
    .on("contextmenu", () => {
      d3.event.preventDefault();
    })
    .attr("width", width)
    .attr("height", height);

  // define arrow markers for graph links
  svg
    .append("svg:defs")
    .append("svg:marker")
    .attr("id", "end-arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 6)
    .attr("markerWidth", 3)
    .attr("markerHeight", 3)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#9b9eff");

  svg
    .append("svg:defs")
    .append("svg:marker")
    .attr("id", "start-arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 4)
    .attr("markerWidth", 3)
    .attr("markerHeight", 3)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M10,-5L0,0L10,5")
    .attr("fill", "#9b9eff");

  const defs = svg.append("defs");

  // define gradients for links
  const gradRight = defs
    .append("linearGradient")
    .attr("id", "gradRight")
    .attr("x1", "0%")
    .attr("x2", "100%");

  const gradLeft = defs
    .append("linearGradient")
    .attr("id", "gradLeft")
    .attr("x1", "0%")
    .attr("x2", "100%");

  gradRight
    .append("stop")
    .attr("class", "start")
    .attr("offset", "0%")
    .attr("stop-color", "#9b9eff")
    .attr("stop-opacity", 1);

  gradRight
    .append("stop")
    .attr("class", "end")
    .attr("offset", "100%")
    .attr("stop-color", "#9b9eff")
    .attr("stop-opacity", 0.1);

  gradLeft
    .append("stop")
    .attr("class", "start")
    .attr("offset", "0%")
    .attr("stop-color", "#9b9eff")
    .attr("stop-opacity", 0.1);

  gradLeft
    .append("stop")
    .attr("class", "end")
    .attr("offset", "100%")
    .attr("stop-color", "#9b9eff")
    .attr("stop-opacity", 1);

  // set up initial nodes and links
  //  - nodes are known by 'id', not by index in array.
  //  - reflexive edges are indicated on the node (as a bold black circle).
  //  - links are always source < target; edge directions are set by 'left' and 'right'.

  // init D3 force layout
  const force = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id(d => d.id)
        .distance(60)
    )
    .force(
      "y",
      d3
        .forceY(d => {
          if (d.priority > 2) {
            return (height / 4) * d.priority - (d.priority * height) / 8;
          } else {
            return (height / 4) * d.priority + (maxDepth + 1) * 5;
          }
        })
        .strength(0.05)
    )
    .force(
      "x",
      d3
        .forceX(d => {
          return depth_log_x(d.depth + 1);
        })
        .strength(0.8)
    )
    .force("charge", d3.forceManyBody().strength(-500))
    .force(
      "collision",
      d3.forceCollide().radius(function(d) {
        return d.radius + 10;
      })
    )
    .on("tick", tick);

  // init D3 drag support
  const drag = d3
    .drag()
    // Mac Firefox doesn't distinguish between left/right click when Ctrl is held...
    .filter(() => d3.event.button === 0 || d3.event.button === 2)
    .on("start", d => {
      if (!d3.event.active) force.alphaTarget(0.3).restart();

      d.fx = d.x;
      d.fy = d.y;
    })
    .on("drag", d => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    })
    .on("end", d => {
      if (!d3.event.active) force.alphaTarget(0);
      // if (d.prereqs === undefined || d.prereqs.length == 0) {
      // } else {
      //   d.fx = null;
      //   d.fy = null;
      // }
    });

  // line displayed when dragging new nodes
  const dragLine = svg
    .append("svg:path")
    .attr("class", "link dragline hidden")
    .attr("d", "M0,0L0,0");

  // handles to link and node element groups
  let path = svg.append("svg:g").selectAll("path");
  let circle = svg.append("svg:g").selectAll("g");

  // mouse event vars
  let selectedNode = null;
  let selectedLink = null;
  let mousedownLink = null;
  let mousedownNode = null;
  let mouseupNode = null;

  function resetMouseVars() {
    mousedownNode = null;
    mouseupNode = null;
    mousedownLink = null;
  }

  // update force layout (called automatically each iteration)
  function tick() {
    // draw directed edges with proper padding from node centers
    path.attr("d", d => {
      const deltaX = d.target.x - d.source.x;
      const deltaY = d.target.y - d.source.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normX = deltaX / dist;
      const normY = deltaY / dist;
      const sourcePadding = d.left ? d.source.radius : d.source.radius - 7;
      const targetPadding = d.right ? d.target.radius : d.target.radius;
      const sourceX = d.source.x + sourcePadding * normX;
      const sourceY = d.source.y + sourcePadding * normY;
      const targetX = d.target.x - targetPadding * normX;
      const targetY = d.target.y - targetPadding * normY;

      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    path.style("stroke", d => {
      const deltaX = d.target.x - d.source.x;
      let gradient =
        deltaX <= 0 && d.right ? "url(#gradLeft)" : "url(#gradRight)";
      return gradient;
    });

    circle.attr("transform", d => {
      d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
      d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
      return `translate(${d.x},${d.y})`;
    });
  }
  // update graph (called when needed)
  function restart() {
    // path (link) group
    path = path.data(links);

    // update existing links
    path
      .classed("selected", d => d === selectedLink)
      .style("marker-start", d => (d.left ? "url(#start-arrow)" : ""))
      .style("marker-end", d => (d.right ? "url(#end-arrow)" : ""));
    // remove old links
    path.exit().remove();

    // add new links
    path = path
      .enter()
      .append("svg:path")
      .attr("class", "link")
      .classed("selected", d => d === selectedLink)
      .style("marker-start", d => (d.left ? "url(#start-arrow)" : ""))
      .style("marker-end", d => (d.right ? "url(#end-arrow)" : ""))
      .on("mousedown", d => {
        if (d3.event.ctrlKey) return;

        // select link
        mousedownLink = d;
        selectedLink = mousedownLink === selectedLink ? null : mousedownLink;
        selectedNode = null;
        restart();
      })
      .merge(path);

    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, d => d.id);

    // update existing nodes (reflexive & selected visual states)
    circle
      .selectAll("circle")
      .style("fill", d =>
        d === selectedNode
          ? d3
              .rgb(colors(d.color))
              .brighter()
              .toString()
          : colors(d.color)
      )
      .classed("reflexive", d => {
        return d.reflexive;
      });

    // remove old nodes
    circle.exit().remove();

    // add new nodes
    const g = circle.enter().append("svg:g");

    g.append("svg:circle")
      .attr("class", "node")
      .attr("r", d => {
        return d.radius - 5;
      })
      .style("fill", d =>
        d === selectedNode
          ? d3
              .rgb(colors(d.color))
              .brighter()
              .toString()
          : colors(d.color)
      )
      .style("stroke", d =>
        d3
          .rgb(colors(d.color))
          .brighter()
          .toString()
      )
      .classed("reflexive", d => d.reflexive)
      .on("mouseover", function(d) {
        if (!mousedownNode || d === mousedownNode) return;
        // enlarge target node
        d3.select(this).attr("transform", "scale(1.1)");
      })
      .on("mouseout", function(d) {
        if (!mousedownNode || d === mousedownNode) return;
        // unenlarge target node
        d3.select(this).attr("transform", "");
      })
      .on("mousedown", d => {
        if (d3.event.ctrlKey) return;

        // select node
        mousedownNode = d;
        selectedNode = mousedownNode === selectedNode ? null : mousedownNode;
        selectedLink = null;

        // reposition drag line
        dragLine
          .style("marker-end", "url(#end-arrow)")
          .classed("hidden", false)
          .attr(
            "d",
            `M${mousedownNode.x},${mousedownNode.y}L${mousedownNode.x},${mousedownNode.y}`
          );

        restart();
      })
      .on("mouseup", function(d) {
        if (!mousedownNode) return;

        // needed by FF
        dragLine.classed("hidden", true).style("marker-end", "");

        // check for drag-to-self
        mouseupNode = d;
        if (mouseupNode === mousedownNode) {
          resetMouseVars();
          return;
        }

        // unenlarge target node
        d3.select(this).attr("transform", "");

        // add link to graph (update if exists)
        // NB: links are strictly source < target; arrows separately specified by booleans
        const isRight = mousedownNode.id < mouseupNode.id;
        const source = isRight ? mousedownNode : mouseupNode;
        const target = isRight ? mouseupNode : mousedownNode;

        const link = links.filter(
          l => l.source === source && l.target === target
        )[0];
        if (link) {
          link[isRight ? "right" : "left"] = true;
        } else {
          links.push({ source, target, left: !isRight, right: isRight });
        }

        // select new link
        selectedLink = link;
        selectedNode = null;
        restart();
      });

    // show node IDs
    g.append("svg:foreignObject")
      .attr("x", d => -d.radius + 2.5)
      .attr("y", d => -d.radius + 2.5)
      .attr("background", "white")
      .attr("height", d => d.radius * 2 - 5)
      .attr("width", d => d.radius * 2 - 5)
      .append("xhtml:div")
      .attr("height", "100%")
      .attr("width", "100%")
      .attr("backgroundColor", "white")
      .text(d => d.name);

    circle = g.merge(circle);

    // set the graph in motion
    force
      .nodes(nodes)
      .force("link")
      .links(links);

    force.alphaTarget(0.3).restart();
  }

  function mousedown() {
    // because :active only works in WebKit?
    svg.classed("active", true);

    if (d3.event.ctrlKey || mousedownNode || mousedownLink) return;

    // insert new node at point
    const point = d3.mouse(this);
    const node = {
      id: ++lastNodeId,
      reflexive: false,
      name: "New Task",
      color: "0",
      prereqs: [],
      depth: 0,
      priority: 4,
      radius: radiusFromArea(),
      reflexive: false,
      x: point[0],
      y: point[1]
    };
    nodes.push(node);

    restart();
  }

  function mousemove() {
    if (!mousedownNode) return;

    // update drag line
    dragLine.attr(
      "d",
      `M${mousedownNode.x},${mousedownNode.y}L${d3.mouse(this)[0]},${
        d3.mouse(this)[1]
      }`
    );
  }

  function mouseup() {
    if (mousedownNode) {
      // hide drag line
      dragLine.classed("hidden", true).style("marker-end", "");
    }

    // because :active only works in WebKit?
    svg.classed("active", false);

    // clear mouse event vars
    resetMouseVars();
  }

  function spliceLinksForNode(node) {
    const toSplice = links.filter(l => l.source === node || l.target === node);
    for (const l of toSplice) {
      links.splice(links.indexOf(l), 1);
    }
  }

  // only respond once per keydown
  let lastKeyDown = -1;

  function keydown() {
    d3.event.preventDefault();

    if (lastKeyDown !== -1) return;
    lastKeyDown = d3.event.keyCode;

    // ctrl
    if (d3.event.keyCode === 17) {
      circle.call(drag);
      svg.classed("ctrl", true);
      return;
    }

    if (!selectedNode && !selectedLink) return;

    switch (d3.event.keyCode) {
      case 8: // backspace
      case 46: // delete
        if (selectedNode) {
          nodes.splice(nodes.indexOf(selectedNode), 1);
          spliceLinksForNode(selectedNode);
        } else if (selectedLink) {
          links.splice(links.indexOf(selectedLink), 1);
        }
        selectedLink = null;
        selectedNode = null;
        restart();
        break;
      case 66: // B
        if (selectedLink) {
          // set link direction to both left and right
          selectedLink.left = true;
          selectedLink.right = true;
        }
        restart();
        break;
      case 76: // L
        if (selectedLink) {
          // set link direction to left only
          selectedLink.left = true;
          selectedLink.right = false;
        }
        restart();
        break;
      case 82: // R
        if (selectedNode) {
          // toggle node reflexivity
          selectedNode.reflexive = !selectedNode.reflexive;
        } else if (selectedLink) {
          // set link direction to right only
          selectedLink.left = false;
          selectedLink.right = true;
        }
        restart();
        break;
    }
  }

  function keyup() {
    lastKeyDown = -1;

    // ctrl
    if (d3.event.keyCode === 17) {
      circle.on(".drag", null);
      svg.classed("ctrl", false);
    }
  }

  // app starts here
  svg
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);
  d3.select(window)
    .on("keydown", keydown)
    .on("keyup", keyup);
  restart();
});
