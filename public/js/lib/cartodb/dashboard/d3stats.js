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
  className: 'dialog',

  events: {
    //'click .close': 'hide'
  },

  default_options: {
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

    // Get data
    this.requests = this.$el.attr("data-requests").split(",");

    // Render graphic!
    this.render();
  },

  render: function() {

    var width = 279
      , height = 36
      , svg = d3.select(this.el)
                .append("svg")
                .attr("width",width)
                .attr("height",height);

    // Get scales and create the line
    var x = d3.scale.linear().domain([0, this.requests.length]).range([0, width])
      , y = d3.scale.linear().domain([0, _.max(this.requests, function(num) {return num})]).range([0, height])
      , line = d3.svg.line()
                .x(function(d,i) { return x(i); })
                .y(function(d) { return y(d); })
                //.interpolate("basis")
  
      // display the line by appending an svg:path element with the data line we created above
      svg.append("svg:path")
        .attr("d", line(this.requests))
        .style("fill", "none")
        .style("stroke-width", "2")
        .style("stroke", "#409FCE")

    return this;
  }

});
