
/**
 *  Visualization mapviews graph
 *
 */

module.exports = cdb.core.View.extend({

  tagName: 'div',
  className: 'stats',

  options: {
    stats:        [],
    width:        72,
    height:       18,
    stroke_width: 1,
    stroke_color: 'white',
    circle_fill:  'white'
  },

  initialize: function() {
    this.options.stats = _.toArray(this.options.stats);
  },

  render: function() {
    var self = this;

    // SVG
    var width  = this.options.width;
    var height = this.options.height;
    var svg    = d3.select(this.$el[0])
                .append("svg")
                .attr("width", width)
                .attr("height", height + 3);
    var max = _.max(_(this.options.stats).map(function(m){ return parseInt(m, 10) }));

    // Get scales and create the line
    var x = d3.scale.linear().domain([0, this.options.stats.length]).range([0, width]);
    var y = d3.scale.linear().domain([0,max]).range([height,2]);
    var line = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d)   { return y(d); });
    var area = d3.svg.area()
      .x(function(d,i) { return x(i); })
      .y0(function(d)  { return height + 3; })
      .y1(function(d)  { return y(d); });

    // display the line by appending an svg:path element with the data line we created above
    svg.append("svg:path")
      .attr("d", area(this.options.stats))
      .style("fill", "none");

    var l = svg.append("svg:path")
      .attr("d", line(this.options.stats))
      .style("fill", "none")
      .style("stroke-width", this.options.stroke_width)
      .style("stroke", this.options.stroke_color)

    var lx = this.options.stats.length - 1;
    var ly = this.options.stats[this.options.stats.length - 1];

    if (lx != null && ly != null) {
      circle = svg.append("svg:circle")
        .attr("cx", x(lx))
        .attr("cy", y(ly))
        .attr("r", 2)
        .style("stroke", "none")
        .style("fill", this.options.circle_fill)
    }

    return this;
  }

});
