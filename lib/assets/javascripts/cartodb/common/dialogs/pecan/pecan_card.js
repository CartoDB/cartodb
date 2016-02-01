var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Utils = require('cdb.Utils');
var Pecan = require('cartodb-pecan');

module.exports = cdb.core.View.extend({

  _CARD_WIDTH: 288,
  _CARD_HEIGHT: 170,
  _TABS_PER_ROW: 3,
  _GET_BBOX_FROM_THE_GEOM: true,

  tagName: "li",
  className: "GalleryList-item MapsList-item js-card",

  events: {
    "click ": "_onClick"
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('common/dialogs/pecan/card');
  },

  render: function() {
    var src = this.options.url + "?api_key=" + this.options.api_key;

    var wizardName = this.model.get("visualizationType").charAt(0).toUpperCase() + this.model.get("visualizationType").slice(1);

    var null_count = +(this.model.get("null_ratio") * this.model.get("count")).toFixed(2);
    var prettyNullCount = Utils.formatNumber(null_count);

    this.$el.html(
      this.template({
      column: this.model.get("column"),
      wizard: wizardName,
      metadata: this.model.get("metadata"),
      null_count: prettyNullCount,
      weight: this.model.get("weight")
    }));

    if (this.model.get("visualizationType") === "choropleth") {
      this._addHistogram();
    }

    var self = this;
    var img = new Image();
    img.onerror = function() {
      cdb.log.info("error loading the image for " + self.model.get("column"));
    };
    img.onload = function() {
      self.$(".js-loader").hide();
      self.$(".js-header").append('<img class="MapCard-preview" src="' + src + '" />');
      self.$("img").show();
    };

    img.src = src;

    return this;
  },

  _onClick: function(e) {
    this.killEvent(e);
    this.trigger("click", this.model, this);
  },

  _addHistogram: function() {
    var data = this.model.get("cat_hist").slice(0, 7);
    data = _.sortBy(data, function(d){ return d[0]; });
    var rampName = Pecan.getMethodProperties(this.model.attributes).name;

    var width = 37;
    var height = 11;
    var minHeight = 2;

    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], .1);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var svg = d3.select(this.$(".js-graph")[0]).append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g");

    x.domain(data.map(function(d) { return d[0]; }));
    y.domain([0, d3.max(data, function(d) { return d[1]; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.selectAll(".bar")
        .data(data)
      .enter().append("rect")
        .attr("fill", function(d, i) {
          return cdb.admin.color_ramps[rampName][7][i];
        })
        .attr("class", "HistogramGraph-bar")
        .attr('data-title', function(d) {
          return Utils.formatNumber(d[1])
        })
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", 4)
        .attr("y", function(d) {
          var value = height - y(d[1]);
          var yPos = y(d[1]);
          return value < minHeight ? (height - minHeight) : yPos;
        })
        .attr("height", function(d) {
          var value = height - y(d[1]);
          return value < minHeight ? minHeight : value;
        })

    return this;
  }

});
