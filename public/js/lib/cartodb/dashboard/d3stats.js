/**
 * generic embbed notification, like twitter "new notifications"
 *
 * it shows slowly the notification with a message and a close button.
 * Optionally you can set a timeout to close
 *
 * usage example:
 *
      var notification = new cdb.ui.common.Notificaiton({
          el: "#notification_element",
          msg: "error!",
          timeout: 1000
      });
      notification.show();
      // close it
      notification.close();
*/

cdb.admin.D3Stats = cdb.core.View.extend({

  tagName: 'div',
  className: 'stats',

  events: {
    //'click .close': 'hide'
  },

  default_options: {
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

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
