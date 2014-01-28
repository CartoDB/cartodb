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
 *      stats: { 2013-12-05: 3, 2013-12-06: 0, 2013-12-07: 30, 2013-12-08: 100, 2013-12-09: 0 }
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
    if (this.options.api_calls) {
      this.requests = this.options.api_calls;
      //this.dates    = _.keys(this.options.stats);
    } else {
      this.requests = _.toArray(this.options.stats)
      this.dates    = _.keys(this.options.stats);
    }

    this.options = _.extend(this.default_options, this.options);

    // Render graphic!
    this.render();
  },


  render: function() {

    var self = this;

    // SVG
    var width  = this.options.width
      , height = this.options.height
      , svg    = d3.select(this.$("div.stats")[0])
                .append("svg")
                .attr("width", width)
                .attr("height", height + 3)
      , max = _.max(_(this.requests).map(function(m){ return parseInt(m, 10) }));

    // Get scales and create the line
    var x = d3.scale.linear().domain([0, this.requests.length]).range([0, width])
      , y = d3.scale.linear().domain([0,max]).range([height,2])
      , line = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d)   { return y(d); })
      , area = d3.svg.area()
      .x(function(d,i) { return x(i); })
      .y0(function(d)  { return height + 3; })
      .y1(function(d)  { return y(d); });

    var div;

    // Creates the tooltip
    if (!$(".mapviews_tooltip").length) {

      var div = d3.select("body").append("div")
        .attr("class", "mapviews_tooltip")
        .style("opacity", 1e-6);

      div.append("span");

      div.append("div")
        .attr("class", "tip")

    } else {
      div = d3.select(".mapviews_tooltip")
    }

    function mouseover() {
      div.transition().duration(200).style("opacity", 1);
    }

    function mousemove() {
      var x0    = d3.mouse(this)[0];
      var y0    = d3.mouse(this)[1];
      var n     = x.invert(x0) | 0;
      var value = self.requests[n];
      var total =  _.reduce(self.requests, function(memo, num){ return memo + num; }, 0);

      var w = $(".mapviews_tooltip").width();

      var when;

      if (self.dates) {
        when = self.dates[n];
      } else {
        when = self.requests[n];
      }

      if (moment(new Date()).format("YYYY-MM-DD") == when ) when = "today";
      else when = "in " + when;

      $(".mapviews_tooltip span").html(self._formatNumber(value) + " " + when + ".<br />" + self._formatNumber(total) + " in the last month");
      $(".mapviews_tooltip .tip")
        .css("left", (w/2 + 0) + "px")

        div
        .style("left", (d3.event.pageX - w/2 - 2) + "px")
        .style("top", (d3.event.pageY - 45) + "px")

    }

    function mouseout() {
      div.transition().duration(200).style("opacity", 1e-6);
    }

    svg
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout)

      // display the line by appending an svg:path element with the data line we created above
      svg.append("svg:path")
      .attr("d", area(this.requests))
      .style("fill", "#ECF5FA")

      var l = svg.append("svg:path")
      .attr("d", line(this.requests))
      .style("fill", "none")
      .style("stroke-width", this.options.stroke_width)
      .style("stroke", "#409FCE")


      if (this.options.show_today) {

        var lx = this.requests.length - 1;
        var ly = this.requests[this.requests.length - 1];

        if (lx != null && ly != null) {
          circle = svg.append("svg:circle")
            .attr("cx", x(lx))
            .attr("cy", y(ly))
            .attr("r", 2)
            .style("stroke", "none")
            .style("fill", "#409FCE")
        }
      }

    // Put total api calls
    this.$("p").html(
        "<strong>" + this._formatNumber(_.reduce(this.requests, function(memo, num){ return memo + num; }, 0)) + "</strong> map views last " + _.size(this.requests) + " days"
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
