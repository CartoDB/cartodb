(function() {

  /*
  * Filter's model
  *
  **/

  cdb.admin.mod.Filter = cdb.core.View.extend({

    _SHORT_MONTH_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    _MONTH_NAMES: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

    tagName: 'li',
    className: 'filter histogram',

    events: {
      'click a.remove': '_remove',
      'focus .range-number input': '_onNumberFilterFocused',
      'change .range-number input': '_onNumberFilterChanged'
    },

    initialize: function() {

      _.bindAll(this, "_barChart");

      this.model.bind('change:hist',  this.render,  this);
      this.model.bind('change:lower', this._renderRange, this);
      this.model.bind('change:upper', this._renderRange, this);
      this.model.bind('error',        this._checkEmpty,  this);

      this.isDate = (this.model.get("column_type") == 'date');
      this.isNumber = (this.model.get("column_type") == 'number');

      if (this.isDate) {
        this.$el.addClass('date');
      }

    },

    _renderHist: function() {
      var self = this;

      var histData = this.model.get('hist');

      if(!histData) return;

      if (histData.length == 1) {
        var M = histData.length;

        this.$el.find(".legend").html(this._cleanString(this.model.escape('column'), 15) + ":");

        this.$(".loading").hide();
        this.$(".empty").hide();
        this.$(".range").hide();
        this.$(".range-number").hide();
        this.$(".only").fadeIn(150);

        return;
      }

      this._checkEmpty();

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
        var span = self.model.get("upper_limit") - self.model.get("lower_limit")
        var bar_size = span/data.length;
        var l = (lower - self.model.get("lower_limit")) * data.length / span;
        var u = (upper - self.model.get("lower_limit")) * data.length / span;

        return self._barChart()
        .dimension(dimK)
        .group(data.map(function(d) { return parseFloat(d.value, 10); }))
        .round(function(v) {
          return Math.ceil(v);
        })
        .x(
          d3.scale.linear()
          .domain([0, data.length])
          .range([0, width])
        )
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

      this._renderHist();

      return this;
    },

    _cleanString: function(s, n) {

      if (s) {
        s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
        s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
      }

      return s;

    },

    _checkEmpty: function() {

      var self = this;

      setTimeout(function() {

        var hist = self.model.get("hist");

        if (hist) {

          if (hist.length > 1) {

            self.$(".empty").hide();
            self.$(".loading").hide();
            if (this.isNumber) {
              self.$(".range-number").fadeIn(250);
            } else {
              self.$(".range").fadeIn(250);
            }
          } else {

            self.$el.find(".legend").html(self.model.escape('column'));

            self.$(".loading").hide();
            self.$(".range").hide();
            self.$(".range-number").hide();
            self.$(".empty").hide();
            self.$(".only").fadeIn(150);
          }
        } else {

          self.$el.find(".legend").html(self._cleanString(self.model.escape('column'), 25) + ":");

          self.$(".range").hide();
          self.$(".range-number").hide();
          self.$(".loading").hide();
          self.$(".empty").fadeIn(150);
        }}
      , 250);

      },

    _getMinMaxFromDate: function(lower, upper) {

      var min, max;

      lower = Math.round(lower);
      upper = Math.round(upper);

      var min_date = this.model._getDateFromTimestamp(lower);
      var max_date = this.model._getDateFromTimestamp(upper);

      var minMaxDate = this._formatDate(min_date, max_date);

      return { min: minMaxDate.min, max: minMaxDate.max };

    },

    _formatLowerUpper: function(lower, upper) {
      return { min: lower.toPrecision( Math.round(lower).toString().length + 2), max: upper.toPrecision( Math.round(upper).toString().length + 2) };
    },

    _renderRange: function() {

      var lower = this.model.get('lower');
      var upper = this.model.get('upper');
      if (_.isNaN(upper) || _.isNaN(lower)) { return; }

      var minMax = {};

      if (this.isDate) {
        minMax = this._getMinMaxFromDate(lower, upper);
      } else {
        minMax = this._formatLowerUpper(lower, upper);
      }

      this._renderRangeText(upper, lower, minMax);
    },

    _renderRangeText: function (upper, lower, minMax) {

      if (!_.isNaN(upper) && !_.isNaN(lower)) {
        if (this.isNumber) {
          this.$('.range').hide();
          this.$('.range-number input.min').val(minMax.min);
          this.$('.range-number input.max').val(minMax.max);
          this.$('.range-number').show();
        } else {
          this.$('.range-number').hide();
          this.$('.range').html(minMax.min + " - " + minMax.max);
          this.$('.range').show();
        }
      }
    },

    _onNumberFilterFocused: function () {
        this.$('.range-number .subtext').show();
    },

    _onNumberFilterChanged: function (event) {
        var $input = $(event.target);
        var value = parseFloat($input.val());
        var isMin = $input.hasClass('min');
        var modelKey = isMin ? 'lower' : 'upper';
        if (!isNaN(value)) {
          var lower = this.model.get('lower');
          var upper = this.model.get('upper');
          var lowerLimit = this.model.get('lower_limit');
          var upperLimit = this.model.get('upper_limit');
          if (value < lowerLimit) { value = lowerLimit; }
          if (value > upperLimit) { value = upperLimit; }
          if (isMin && value > upper) { value = upper; }
          if (!isMin && value < lower) { value = lower; }
          this.model.set(modelKey, value);
          this._renderHist();
        } else {
          $input.val(this.model.get(modelKey));
        }
        this.$('.range-number .subtext').hide();
    },

    _remove: function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.model.destroy();
    },

    _updateBounds:function(bounds, update) {

      if (bounds) {

        var n = this.model.get("hist").length;
        var lower = this.model.interpolate(bounds[0]/n);
        var upper = this.model.interpolate(bounds[1]/n);

        if (update) {
          if (!_.isNaN(lower)) this.model.set('lower', lower);
          if (!_.isNaN(upper)) this.model.set('upper', upper);
        }

        var minMax = null;
        if (this.isDate) {
          minMax = this._getMinMaxFromDate(lower, upper);
        } else {
          minMax = this._formatLowerUpper(lower, upper);
        }

        this._renderRangeText(upper, lower, minMax);
      }

    },

    _formatDate: function(min_date, max_date) {

      function get_nth_suffix(date) {
        switch (date) {
          case 1:
          case 21:
          case 31:
            return 'st';
          case 2:
          case 22:
            return 'nd';
          case 3:
          case 23:
            return 'rd';
          default:
            return 'th';
        }
      }

      function pad(n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
      }

      var minDay = min_date.getDate();
      var maxDay = max_date.getDate();

      var minYear = min_date.getFullYear();
      var maxYear = max_date.getFullYear();

      var minMonth = min_date.getMonth();
      var maxMonth = max_date.getMonth();

      var minTime = pad(min_date.getHours(), 2) + ":" + pad(min_date.getMinutes(), 2) + " ";
      var minDate = pad(minDay, 2) + " " + this._SHORT_MONTH_NAMES[minMonth] + " " + minYear;

      var maxTime = pad(max_date.getHours(), 2) + ":" + pad(max_date.getMinutes(), 2) + " ";
      var maxDate = pad(maxDay, 2) + " " + this._SHORT_MONTH_NAMES[maxMonth] + " " + maxYear;

      return { min: minDate + " @ " + minTime, max: maxDate + " @ " + maxTime }

    },

    _barChart: function() {

      var self = this;

      var
        minHeight = 97,
                  margin = {top: 0, right: 10, bottom: 0, left: 10},
                  x, y   = d3.scale.linear().range([100, 0]),
                  id     = this.cid,
                  brush  = d3.svg.brush(),
                  brushDirty,
                  dimension,
                  group,
                  round,
                  initialBounds = [];

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


            self._updateBounds(extent, false);

          }
        }

        g.selectAll(".bar").attr("d", barPath);

        });

        function barPath(h, i) {

          var path = [],
              i = -1,
              n = h.length,
              d;

          var barWidth = width/n;
          while (++i < n) {
            d = h[i];

            inverseHeight = y(d);
            if (inverseHeight > minHeight && inverseHeight < height ) inverseHeight = minHeight;
            path.push("M", x(i), ",", height, "V", inverseHeight, "h", barWidth, "V", height);
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
        var extent = brush.extent();
        initialBounds = [extent];
        self._updateBounds(extent, false);
      });

      brush.on("brush.chart", function() {

        var extent = brush.extent();

        if (initialBounds.length >= 2) {
          if (extent[0] === initialBounds[1][0]) {
            extent[0] = initialBounds[0][0];
          } else if (extent[1] === initialBounds[1][1]) {
            extent[1] = initialBounds[0][1];
          }

          var g = d3.select(this.parentNode);
          g.select("#clip-" + id + " rect")
            .attr("x", x(extent[0]))
            .attr("width", x(extent[1]) - x(extent[0]));

          self._updateBounds(extent, false);
        } else {
          initialBounds.push(extent);
        }

      });

      brush.on("brushend.chart", function() {
        var extent = brush.extent();
        if (initialBounds.length >= 2) {
          if (extent[0] === initialBounds[1][0]) {
            extent[0] = initialBounds[0][0];
          } else if (extent[1] === initialBounds[1][1]) {
            extent[1] = initialBounds[0][1];
          }

          brush.extent(extent);
          self._updateBounds(extent, true);
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
