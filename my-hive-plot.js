var hive = (function() {
  var outerRadius = 300;
  var innerRadius = 20;
  var svg = d3.select("#chart")
  .append("svg")
  .attr("width", 640)
  .attr("height", 640)
  .append("g")
  .attr("transform",
  "translate(" + (outerRadius-20) + "," + (outerRadius+10) +")");


  /**
  Connect the nodes and links data with each other.
  */
  function addInOut(nodes, links){
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
  }

  /**
  Assign node type according to the connections.
  */
  function assignNodeTypes(nodes) {
    nodes.forEach(function addType(node) {
      if (!node.out) {
        node.type = "target";
      } else if (!node.in) {
        node.type = "source";
      } else {
        node.type = "source-target";
      }
    })
  }

  /**
  Sort nodes into different types
  */
  function sortNodesByType(nodes){
    return d3.nest()
    .key( function(d) { return d.type; })
    .sortKeys(d3.ascending)
    .entries(nodes);
  }

  /**
  Assign nodes indices
  */
  function assignIndex(nodesByType){
    nodesByType.forEach(function(nodes){
      var i;
      for (i=0; i< nodes.values.length; i+=1) {
        nodes.values[i].index = i;
      }
    });
  }

  /**
  Duplicate the target-source axis as source-target.
  */
  function duplicateNodes(nodesByType, nodes) {
    var targetSource = [];
    if (nodesByType[1].key === "source-target") {
      nodesByType[1].values.forEach(function(node){
        var outEdges = node.out;
        var newNode = {
          id: node.id,
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
    }
    return targetSource;
  }

  /**
   Highlight the link and connected nodes on mouseover.
  */
  function linkMouseover(d) {
    svg.selectAll(".link")
    .classed("active", function(p) { return p === d; });
    svg.selectAll(".node")
    .classed("active", function(p) {
      return p === d.source || p === d.target;
    });
    d3.select("#status").text(d.source.id + " -> " + d.target.id);
  }

  /**
  Mouseover event handler for nodes
  */
  function nodeMouseover(d) {
    svg.selectAll(".node")
    .classed("active", function(p) {
      return p === d;
    });

    var srcs = [];
    var dsts = [];
    svg.selectAll(".link")
    .classed("active", function(p) {
      if (p.source === d) {
        dsts.push(p.target);
        return true;
      } else if (p.target === d) {
        srcs.push(p.source);
        return true;
      } else {
        return false;
      }
    });

    var status = d.id;
    if (srcs.length > 0) {
      status = status + " <- ";
      srcs.forEach(function(l){
        status = status + " " + l.id;
      });
    } else if (dsts.length > 0) {
      status = status + " -> ";
      dsts.forEach(function(l){
        status = status + " " + l.id;
      });
    }
    d3.select("#status").text(status);
  }


  function mouseout() {
    svg.selectAll(".active").classed("active", false);
    d3.select("#status").text("Select an item in the chart to see details.");
  }

  function plot(graph) {
    var nodes = graph.nodes;
    var links = graph.links;

    // Original data is given in the node and link format

    addInOut(nodes, links);

    assignNodeTypes(nodes);
    var nodesByType = sortNodesByType(nodes);

    //
    assignIndex(nodesByType);

    var radiusScale = d3.scale.linear()
    .domain(d3.extent(nodes, function(node) { return node.index; }))
    .range([innerRadius, outerRadius]);

    // Duplicate the target-source axis as source-target.
    var newNodes = duplicateNodes(nodesByType, nodes);
    if (newNodes.length > 0) {
      nodes = nodes.concat(newNodes);
    }
    // Draw the axes.
    svg.selectAll(".axis")
    .data(nodesByType)
    .enter().append("line")
    .attr("class", "axis")
    .attr("transform", function(d) {
      return "rotate(" + degrees(angleScale(d.key)) + ")";
    })
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
    .style("fill", function(d) { return color(d.id); })
    .attr("r", 4)
    .attr("cx", nodeCx)
    .attr("cy", nodeCy)
    .on("mouseover", nodeMouseover)
    .on("mouseout", mouseout);

  }

  return {
    plot: plot
  }

})();
