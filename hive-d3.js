var majorAngle = 2.0 * Math.PI / 3; // angle between major axis
var minorAngle = 1.0 * Math.PI / 12;

var angleScale = d3.scale.ordinal()
  .domain(["source", "source-target", "target-source", "target"])
  .range([-majorAngle, -minorAngle, minorAngle,  majorAngle]);

var color = d3.scale.category10();

/**
   Hive plot for D3js

   Adopted the blog by Mike Bostock.

   Create link by calling

   link()

   The object need to have the following fields:
   .source - The source node of the link
   .target - The target node of the link
   .radius - A callback function to generate radius value.
   .angle - A callback function to generate angle value.
*/

// A shape generator for Hive links, based on a source and a target.
// The source and target are defined in polar coordinates (angle and radius).
// Ratio links can also be drawn by using a startRadius and endRadius.
// This class is modeled after d3.svg.chord.

function link() {
  var source = function(d) { return d.source; },
      target = function(d) { return d.target; },
      angle = function(d) { return d.angle; },
      startRadius = function(d) { return d.radius; },
      endRadius = startRadius,
      arcOffset = 0;

  function link(d, i) {
    var s = node(source, this, d, i),
        t = node(target, this, d, i),
        x;
    if (t.a < s.a) x = t, t = s, s = x;
    if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
    var a1 = s.a + (t.a - s.a) / 3,
        a2 = t.a - (t.a - s.a) / 3;
    return "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
      + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
      + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
      + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
  }

  function node(method, thiz, d, i) {
    var node = method.call(thiz, d, i),
        a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
        r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
        r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
    return {r0: r0, r1: r1, a: a};
  }

  link.source = function(_) {
    if (!arguments.length) return source;
    source = _;
    return link;
  };

  link.target = function(_) {
    if (!arguments.length) return target;
    target = _;
    return link;
  };

  link.angle = function(_) {
    if (!arguments.length) return angle;
    angle = _;
    return link;
  };

  link.radius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = endRadius = _;
    return link;
  };

  link.startRadius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = _;
    return link;
  };

  link.endRadius = function(_) {
    if (!arguments.length) return endRadius;
    endRadius = _;
    return link;
  };

  return link;
}

/**
  Utility for plotting nodes. The nodes are simply drawn as circles and
  therefore do not need complicated shape generators.
 */
var nodeUtil = {
  /* Compute the cartesian from polar coordinates. */
  cx: function cx(node, r, a) {
    return  r * (Math.cos(a));
  },
  /* Compute the cartesian from polar coordinates. */
  cy: function cy(node, r, a) {
    return r * Math.sin(a);
  }
};

function degrees(radians) {
  return radians / Math.PI * 180;
}
