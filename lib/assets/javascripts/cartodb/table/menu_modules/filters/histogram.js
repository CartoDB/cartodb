(function() {

  /*
  * Filter's model
  *
  **/

  cdb.admin.mod.Filter = cdb.core.View.extend({

    tagName: 'li',
    className: 'filter histogram',

    events: {
      'click a.remove': '_remove'
    },

    initialize: function() {

      _.bindAll(this, "_barChart");

      this.model.bind('change:hist',  this._renderHist, this);

      this.model.bind('change:lower', this._renderRange, this);
      this.model.bind('change:upper', this._renderRange, this);

    },

    _renderHist: function() {

      var self = this;

      var histData = this.model.get('hist');

      var M = histData.length;

      var data = histData.map(function(x, i) {
        return { value: x };
      });

      var filter = crossfilter(data);

      var dim = function(k) {
        return filter.dimension(function (d) {
          return d[k];
        });
      }

      var def = function(k) {

        var dimK  = dim(k);

        var width = 325;

        var lower = self.model.get("lower");
        var upper = self.model.get("upper");

        // Inverse interpolation
        var l = (lower - self.model.get("lower_limit")) * data.length / (self.model.get("upper_limit") - self.model.get("lower_limit"));
        var u = (upper - self.model.get("lower_limit")) * data.length / (self.model.get("upper_limit") - self.model.get("lower_limit"));

        return self._barChart()
        .dimension(dimK)
        .group(data.map(function(d) { return parseFloat(d.value, 10); }))
        .x(d3.scale.linear()
        .domain([0, data.length])
        .range([0, width]))
        .filter([l, u])
      }

      var chartDefs = [def('value')];

      var chartDivs = d3.select(".hist." + this.cid)
      .data(chartDefs)
      .each(function(chartDiv) {
        chartDiv.on("brush", renderAll).on("brushend", renderAll);
      });

      function renderAll() {
        chartDivs.each(function(method) {
          d3.select(this).call(method);
        });
      }

      renderAll();

    },

    render: function() {

      var self = this;

      this.$el.html(this.getTemplate('table/menu_modules/filters/templates/histogram')({
        legend: this.model.escape('column'),
        cid: self.cid
      }));

      this._checkEmpty();

      return this;
    },

    _checkEmpty: function() {
    var self = this;

      setTimeout(function() {
      if (self.model.has("hist")) {
        self.$(".range").show();
        self.$(".empty").hide();
      } else {
        self.$(".range").hide();
        self.$(".empty").fadeIn(150);
      }}
      , 100);

    },

    _renderRange: function() {

      var lower = this.model.get('lower');
      var upper = this.model.get('upper');

      if (lower) lower = lower.toPrecision(2);
      if (upper) upper = upper.toPrecision(2);

      this.$('.range').html(lower + " - " + upper);

    },

    _remove: function(e) {

      this.killEvent(e);
      this.model.destroy();
    },

    _updateBounds:function(bounds) {

      if (bounds) {

        var n = this.model.get("hist").length;

        var lower = this.model.interpolate(bounds[0]/n);
        var upper = this.model.interpolate(bounds[1]/n);

        bounds[0] && this.model.set('lower', lower);
        bounds[1] && this.model.set('upper', upper);

        this.$('.range').html(lower.toPrecision(2) + " - " + upper.toPrecision(2));

      }

    },

    _barChart: function() {

      var self = this;

      var
      margin = {top: 0, right: 10, bottom: 0, left: 10},
      x, y   = d3.scale.linear().range([100, 0]),
      id     = this.cid,
      brush  = d3.svg.brush(),
      brushDirty,
      dimension,
      group,
      round;

      function chart(div) {

        var
        width  = x.range()[1],
        height = y.range()[0];

        y.domain([0, d3.max(group)]);

        div.each(function() {

          var div = d3.select(this),
          g = div.select("g");

          // Create the skeletal chart.
          if (g.empty()) {

            g = div.append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            g.append("clipPath")
            .attr("id", "clip-" + id)
            .append("rect")
            .attr("width", width)
            .attr("height", height);

            g.selectAll(".bar")
            .data(['background', 'foreground'])
            .enter().append("path")
            .attr("class", function(d) { return d + " bar"; })
            .data([group, group])

            g.selectAll(".foreground.bar")
            .attr("clip-path", "url(#clip-" + id + ")");

            // Initialize the brush component with pretty resize handles.
            var gBrush = g.append("g").attr("class", "brush").call(brush);
            gBrush.selectAll("rect").attr("height", height);
            gBrush.selectAll(".resize").append("path").attr("d", resizePath);
          }

          // Only redraw the brush if set externally.
          if (brushDirty) {

            brushDirty = false;
            g.selectAll(".brush").call(brush);

            if (brush.empty()) {
              g.selectAll("#clip-" + id + " rect")
              .attr("x", 0)
              .attr("width", width);
            } else {

              var extent = brush.extent();

              g.selectAll("#clip-" + id + " rect")
              .attr("x", x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));


              self._updateBounds(extent);

            }
          }

          g.selectAll(".bar").attr("d", barPath);

        });

        function barPath(h, i) {

          var path = [],
          i = -1,
          n = h.length,
          d;

          while (++i < n) {

            d = h[i];
            path.push("M", x(i), ",", height, "V", y(d), "h9V", height);
          }

          return path.join("");

        }

        function resizePath(d) {
          var e = +(d == "e"),
          x = e ? 1 : -1,
          y = height / 3;
          return "M" + (.5 * x) + "," + y
          + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
          + "V" + (2 * y - 6)
          + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
          + "Z"
          + "M" + (2.5 * x) + "," + (y + 8)
          + "V" + (2 * y - 8)
          + "M" + (4.5 * x) + "," + (y + 8)
          + "V" + (2 * y - 8);
        }
      }

      brush.on("brushstart.chart", function() {
        var div = d3.select(this.parentNode.parentNode.parentNode);
      });

      brush.on("brush.chart", function() {

        var g = d3.select(this.parentNode),
        extent = brush.extent();

        self._updateBounds(extent);

        if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
        .style("display", null);

        g.select("#clip-" + id + " rect")
        .attr("x", x(extent[0]))
        .attr("width", x(extent[1]) - x(extent[0]));

        dimension.filterRange(extent);

      });

      brush.on("brushend.chart", function() {

        if (brush.empty()) {

          var div = d3.select(this.parentNode.parentNode.parentNode);

          div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
          dimension.filterAll();


          var extent = brush.extent();
          self._updateBounds(extent);

        }

      });

      chart.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return chart;
      };

      chart.x = function(_) {
        if (!arguments.length) return x;
        x = _;
        brush.x(x);
        return chart;
      };

      chart.y = function(_) {
        if (!arguments.length) return y;
        y = _;
        return chart;
      };

      chart.dimension = function(_) {
        if (!arguments.length) return dimension;
        dimension = _;
        return chart;
      };

      chart.filter = function(_) {
        if (_) {
          brush.extent(_);
          dimension.filterRange(_);
        } else {
          brush.clear();
          dimension.filterAll();
        }
        brushDirty = true;
        return chart;
      };

      chart.group = function(_) {
        if (!arguments.length) return group;
        group = _;
        return chart;
      };

      chart.round = function(_) {
        if (!arguments.length) return round;
        round = _;
        return chart;
      };

      return d3.rebind(chart, brush, "on");
    }

  });

})();
