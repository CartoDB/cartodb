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


  initialize: function() {
    // Get data
    this.requests = this.options.api_calls;

    // Render graphic!
    this.render();
  },


  render: function() {

    // SVG
    var width = 291
      , height = 36
      , svg = d3.select(this.$el.find("div.stats")[0])
                .append("svg")
                .attr("width",width)
                .attr("height",height)
      , max = _.max(_(this.requests).map(function(m){ return parseInt(m, 10) }));

    // Get scales and create the line
    var x = d3.scale.linear().domain([0, this.requests.length]).range([0, width])
      , y = d3.scale.linear().domain([0,max]).range([height,2])
      , line = d3.svg.line()
                .x(function(d,i) { return x(i); })
                .y(function(d) { return y(d); })
      , area = d3.svg.area()
                .x(function(d,i) { return x(i); })
                .y0(function(d) { return height; })
                .y1(function(d) { return y(d); });
  
      // display the line by appending an svg:path element with the data line we created above
      svg.append("svg:path")
        .attr("d", area(this.requests))
        .style("fill", "#ECF5FA")

      svg.append("svg:path")
        .attr("d", line(this.requests))
        .style("fill", "none")
        .style("stroke-width", "2")
        .style("stroke", "#409FCE")


    // Put total api calls
    this.$el.find("p").html(
      "<strong>" + _.reduce(this.requests, function(memo, num){ return memo + num; }, 0) + "</strong> API calls the last " + _.size(this.requests) + " days"
    )

    return this;
  }

});
