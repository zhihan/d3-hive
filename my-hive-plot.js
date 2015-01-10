// Nothing yet
var outerRadius = 200;
var innerRadius = 20;

var svg = d3.select("#chart")
  .append("svg")
  .attr("width", 440)
  .attr("height", 440)
  .append("g")
    .attr("transform",
      "translate(" + (outerRadius-20) + "," + (outerRadius+10) +")");

// Original data is given in the node and link format
var nodes = [{name: "a"}, {name:"b"}, {name:"c"}, {name:"d"}];
var links = [
  { source: 0, target: 1}, { source: 0, target:2 },
{ source: 1, target:2}, {source:2, target:3}
];

(function addInOut(nodes, links){
  links.forEach(function(link) {
    var src = nodes[link.source];
    var tgt = nodes[link.target];
    if (src.out) {
      src.out.push(link);
    } else {
      src.out = [link];
    }
    if (tgt.in) {
      tgt.in.push(link);
    } else {
      tgt.in = [link];
    }
    link.source = src;
    link.target = tgt;
  });
}) (nodes, links);

(function assignNodeType(nodes) {
  nodes.forEach(function addType(node) {
    if (!node.out) {
      node.type = "target";
    } else if (!node.in) {
      node.type = "source";
    } else {
      node.type = "source-target";
    }
  })
})(nodes);

var nodesByType = (function sortNodesByType(nodes){
  return d3.nest()
  .key( function(d) { return d.type; })
  .sortKeys(d3.ascending)
  .entries(nodes);
}) (nodes);

//
(function assignIndex(nodesByType){
  nodesByType.forEach(function(nodes){
    var i;
    for (i=0; i< nodes.values.length; i+=1) {
      nodes.values[i].index = 10 + i;
    }
  });
})(nodesByType);

var radiusScale = d3.scale.linear()
  .domain([0, 13])
  .range([innerRadius, outerRadius]);

// Duplicate the target-source axis as source-target.
(function duplicateNodes(nodesByType) {
  var targetSource = [];
  nodesByType[1].values.forEach(function(node){
    var outEdges = node.out;
    var newNode = {
      name: node.name,
      type: "target-source",
      index: node.index
    };
    outEdges.forEach(function(link){
      link.source = newNode;
    });
    targetSource.push(newNode);

    delete node.out;
    delete node.in;
  });
  nodesByType.push({key: "target-source", values: targetSource});
  nodes = nodes.concat(targetSource);
})(nodesByType);

// Draw the axes.
svg.selectAll(".axis")
  .data(nodesByType)
  .enter().append("line")
    .attr("class", "axis")
    .attr("transform", function(d) { return "rotate(" + degrees(angleScale(d.key)) + ")"; })
    .attr("x1", radiusScale(0))
    .attr("x2", function(d) { return radiusScale(15); });

function nodeAngle(node){
  return angleScale(node.type);
}

function nodeRadius(node) {
  return radiusScale(node.index);
}

// Draw the links
svg.append("g")
  .attr("class", "links")
  .selectAll(".link")
    .data(links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", link()
        .angle(nodeAngle)
        .radius(nodeRadius))
      .on("mouseover", linkMouseover)
      .on("mouseout", mouseout);

// Highlight the link and connected nodes on mouseover.
function linkMouseover(d) {
  svg.selectAll(".link")
    .classed("active", function(p) { return p === d; });
  svg.selectAll(".node")
    .classed("active", function(p) {
      return p === d.source || p === d.target;
    });
  d3.select("#status").text(d.source.name + "->" + d.target.name);
}

// Clear any highlighted nodes or links.
function mouseout() {
  svg.selectAll(".active").classed("active", false);
  d3.select("#status").text("Select an item in the chart to see details.");
}

function nodeCx(node) {
  return nodeUtil.cx(node, nodeRadius(node), nodeAngle(node));
}

function nodeCy(node) {
  return nodeUtil.cy(node, nodeRadius(node), nodeAngle(node));
}

// Draw the nodes
svg.append("g")
  .attr("class", "nodes")
  .selectAll(".node")
  .data(nodes)
  .enter().append("circle")
  .attr("class", "node")
  .style("fill", function(d) { return color(d.name); })
  .attr("r", 4)
  .attr("cx", nodeCx)
  .attr("cy", nodeCy)
  .on("mouseover", nodeMouseover)
  .on("mouseout", mouseout);

function nodeMouseover(d) {
  svg.selectAll(".node")
    .classed("active", function(p) {
      return p === d;
    });
  svg.selectAll(".link")
    .classed("active", function(p) {
      return (p.source === d) || (p.target === d);
    });
}
