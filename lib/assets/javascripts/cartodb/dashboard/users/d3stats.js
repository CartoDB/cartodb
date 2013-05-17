/**
 * Show the request user has made in the last times (month or 21 days)
 *
 * It just prints the requests data as a simple chart.
 * It needs the data as an Array to work.
 *
 * Usage example:
 *
 *    // D3 API Requests
 *    this.stats = this.stats = new cdb.admin.D3Stats({
 *      el: this.$el.find("li:eq(2)"),
 *      api_calls: this.model.attributes.api_calls
 *    });
 */

cdb.admin.D3Stats = cdb.core.View.extend({

  tagName: 'div',
  className: 'stats',

  default_options: {
    show_today: false,
    width: 291,
    height: 33,
    stroke_width: 2
  },

  initialize: function() {
    // Get data
    this.requests = this.options.api_calls || [];

    this.options = _.extend(this.default_options, this.options);

    // Render graphic!
    this.render();
  },


  render: function() {

    // SVG
    var width  = this.options.width
      , height = this.options.height
      , svg    = d3.select(this.$el.find("div.stats")[0])
                .append("svg")
                .attr("width", width)
                .attr("height", height + 3)
      , max = _.max(_(this.requests).map(function(m){ return parseInt(m, 10) }));

    // Get scales and create the line
    var x = d3.scale.linear().domain([0, this.requests.length]).range([0, width])
      , y = d3.scale.linear().domain([0,max]).range([height,2])
      , line = d3.svg.line()
                .x(function(d,i) { return x(i); })
                .y(function(d) { console.log(d, y(d)); return y(d); })
      , area = d3.svg.area()
                .x(function(d,i) { return x(i); })
                .y0(function(d) { return height + 3; })
                .y1(function(d) { return y(d); });

      // display the line by appending an svg:path element with the data line we created above
      svg.append("svg:path")
        .attr("d", area(this.requests))
        .style("fill", "#ECF5FA")

      svg.append("svg:path")
        .attr("d", line(this.requests))
        .style("fill", "none")
        .style("stroke-width", this.options.stroke_width)
        .style("stroke", "#409FCE")

        if (this.options.show_today) {

          var lx = this.requests.length - 1;
          var ly = this.requests[this.requests.length - 1];

          if (lx && ly) {
            svg.append("svg:circle")
            .attr("cx", x(lx))
            .attr("cy", y(ly))
            .attr("r", 2)
            .style("stroke", "none")
            .style("fill", "#409FCE")
          }
        }


    // Put total api calls
    this.$el.find("p").html(
      "<strong>" + this._formatNumber(_.reduce(this.requests, function(memo, num){ return memo + num; }, 0)) + "</strong> map views the last " + _.size(this.requests) + " days"
    )

    return this;
  },

  _formatNumber: function(str) {
    var amount = new String(str);
    amount = amount.split("").reverse();

    var output = "";
    for ( var i = 0; i <= amount.length-1; i++ ){
      output = amount[i] + output;
      if ((i+1) % 3 == 0 && (amount.length-1) !== i)output = ',' + output;
    }
    return output;
  }

});
