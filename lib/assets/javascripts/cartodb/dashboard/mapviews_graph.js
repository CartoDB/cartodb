var cdb = require('cartodb.js-v3');
var pluralizeString = require('../common/view_helpers/pluralize_string');
var Utils = require('cdb.Utils');
var _ = require('underscore-cdb-v3');


/**
 *  Visualization mapviews graph
 *
 */

module.exports = cdb.core.View.extend({

  options: {
    stats:        [],
    width:        127,
    height:       22
  },

  initialize: function() {
    this.options.stats = _.map(
      this.options.stats,
      function(val, date) {
        return {
          mapviews: val,
          when: date,
          today: moment(new Date(date)).format('DD/MM/YYYY') == moment(new Date()).format('DD/MM/YYYY')
        }
      }
    );
  },

  render: function() {
    var self = this;
    var width = this.options.width;
    var height = this.options.height;
    var data = this.options.stats;
    var minHeight = 2;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(this.$el[0]).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g");

    
    x.domain(data.map(function(d) { return d.when; }));
    y.domain([0, d3.max(data, function(d) { return d.mapviews; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("class", "MapviewsGraph-bar")
        .attr('data-title', function(d) {
          return Utils.formatNumber(d.mapviews) + ' ' + pluralizeString('mapview', d.mapviews) + ( d.today ? (' today') : (' on ' + d.when) )
        })
        .attr("x", function(d) { return x(d.when); })
        .attr("width", 3)
        .attr("y", function(d) {
          var value = height - y(d.mapviews);
          var yPos = y(d.mapviews);
          return value < minHeight ? (height - minHeight) : yPos;
        })
        .attr("height", function(d) {
          var value = height - y(d.mapviews);
          return value < minHeight ? minHeight : value;
        })
        .on('mouseover', function(d) {
          if (d.mapviews > 0) {
            var $el = $(d3.select(this)[0]);
            self.addView(
              new cdb.common.TipsyTooltip({
                el: $el,
                className: 'MapviewsGraph-tooltip',
                html: true,
                trigger: 'manual',
                title: function(e) { return $(this).attr('data-title') }
              })
            );
            $el.tipsy('show');  
          }
        })
        .on('mouseout', function(d) {
          if (d.mapviews > 0) {
            var $el = $(d3.select(this)[0]);
            // Eliminating tipsy thing from the single graph bar
            $el.tipsy('hide');
            $el.unbind('mouseleave mouseenter');
          }
        });

    return this;
  }

});
