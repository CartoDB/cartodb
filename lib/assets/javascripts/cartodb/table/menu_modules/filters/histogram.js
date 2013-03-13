
(function() {

/*
 * Slider
 *
 **/

var SliderControl = cdb.core.View.extend({

  initialize: function() {
    var self = this;
    _.bindAll(self, 'pos');
    this.mix = 0;
    this.max = 100;
    self.pos(this.options.position);
    this.$el.draggable({
      axis: "x",
      drag: function(event, ui) {
          self.pos(ui.position.left);
      },
      stop: function(event, ui) {
          self.pos(ui.position.left);
      },
      grid: [7, 7]
    });
  },

  pos: function(p) {
    var self = this;
    if(p !== undefined) {
        self.position = p;
        self.$el.css({left: self.position});
        self.trigger('move', self.position);
    }
    return self.position;
  },

  set_constrain: function(min, max) {
    this.min = min;
    this.max = max;
    this.$el.draggable( "option", "containment", [min, 0, max, 100]);
  },

  bar_width: function(b) {
    this.$el.draggable( "option", "grid", [b, b]);
  }

});

function Histogram(svg) {

  var w = svg.attr('width');
  var h = svg.attr('height');
  var bar_width = 0;

  var x = d3.scale.linear()
    .domain([0, 1])
    .range([0, w]);

  var y = d3.scale.linear()
    .domain([0, 1.0])
    .range([h, 0]);


  function _hist() { }

  _hist.update = function(data) {

    x.domain([0, data.length]);

    var bar = svg.selectAll(".bar")
    .data(data)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d, i) { return "translate(" + x(i) + "," + y(d) + ")"; });

    bar_width = w/data.length;

    bar.append("rect")
    .attr("x", 1)
    .attr("width", bar_width - 1)
    .attr("height", function(d) { return h - y(d); });
  };

  _hist.bar_width = function() {
    return bar_width;
  };

  _hist.width = function() {
    return parseInt(w, 10);
  };

  return _hist;

}

/*
 * Filter's model
 *
 **/

cdb.admin.mod.Filter = cdb.core.View.extend({

  tagName: 'li',
  className: 'histogram_filter',

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
        return Math.max(0, Math.min(6 * M, d[k]));
      });
    }

    var def = function(k) {

      var dimK = dim(k);

      return self._barChart()
      .dimension(dimK)
      .group(dimK.group(Math.round))
      .x(d3.scale.linear()
      .domain([0, 20])
      .rangeRound([0, 250]));
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

    window.reset = function(i) {
      chartDefs[i].filter(null);
      renderAll();
    };

    renderAll();

  },

  render: function() {

    var self = this;

    this.$el.html(this.getTemplate('table/menu_modules/views/filter')({
      legend: this.model.escape('column'),
      cid: self.cid
    }));


    // render hist
    //var svg = d3.select(this.$('.hist')[0]).append("svg")
    //.attr("width", this.$el.width())
    //.attr("height", this.$el.height());

    // add range slides
    //this.leftSlider = new SliderControl({
    //className: 'left_slider',
    //position: -1
    //});

    //this.rigthSlider = new SliderControl({
    //className: 'right_slider',
    //position: this.$el.width()
    //});

    //this.leftSlider.bind('move', function(pos) {
    //self.model.set('lower', self.qtyFromSliderPos(pos));
    //});

    //this.rigthSlider.bind('move', function(pos) {
    //self.model.set('upper', self.qtyFromSliderPos(pos));
    //});

    //this.hist = Histogram(svg);
    //this._renderHist();

    //this.$('.hist').append(this.rigthSlider.el).append(this.leftSlider.el);
    //this.addView(this.rigthSlider);
    //this.addView(this.leftSlider);

    return this;
  },

  _renderRange: function() {

    this.$('.range').html(this.model.get('lower') + " - " + this.model.get('upper'));
    var base = this.$el.offset();

    //this.leftSlider.bar_width(this.hist.bar_width());
    //this.leftSlider.set_constrain(base.left, base.left + this.hist.width());
    //this.rigthSlider.set_constrain(base.left, base.left + this.hist.width());
  },

  _remove: function(e) {
    this.killEvent(e);
    this.model.destroy();
  },

  _barChart: function() {

    var self = this;

    var
    margin = {top: 10, right: 10, bottom: 20, left: 10},
    x, y   = d3.scale.linear().range([100, 0]),
    id     = this.cid,
    axis   = d3.svg.axis().orient("bottom"),
    brush  = d3.svg.brush(),
    brushDirty,
    dimension,
    group,
    round;

    function chart(div) {

      var
      width  = x.range()[1],
      height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {


        var div = d3.select(this),
        g = div.select("g");

        //console.log(div[0][0]);

        // Create the skeletal chart.
        if (g.empty()) {

          div.select(".legend").append("a")
          .attr("href", "javascript:reset(" + id + ")")
          .attr("class", "reset")
          .text("reset")
          .style("display", "none");

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
          .data(["background", "foreground"])
          .enter().append("path")
          .attr("class", function(d) { return d + " bar"; })
          .datum(group.all());

          g.selectAll(".foreground.bar")
          .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
          .attr("class", "axis")
          .attr("transform", "translate(0," + height + ")")
          .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {

          brushDirty = false;
          g.selectAll(".brush").call(brush);

          div.select(".legend a").style("display", brush.empty() ? "none" : null);

          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
            .attr("x", 0)
            .attr("width", width);
          } else {

            var extent = brush.extent();

            g.selectAll("#clip-" + id + " rect")
            .attr("x", x(extent[0]))
            .attr("width", x(extent[1]) - x(extent[0]));


            self.model.set('lower', extent[0]);
            self.model.set('upper', extent[1]);
          }
        }

        g.selectAll(".bar").attr("d", barPath);

      });

      function barPath(groups) {
        var path = [],
        i = -1,
        n = groups.length,
        d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
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
      div.select(".legend a").style("display", null);
      console.log('start');
    });

    brush.on("brush.chart", function() {

      var g = d3.select(this.parentNode),
      extent = brush.extent();

      if (round) g.select(".brush")
        .call(brush.extent(extent = extent.map(round)))
      .selectAll(".resize")
      .style("display", null);

      g.select("#clip-" + id + " rect")
      .attr("x", x(extent[0]))
      .attr("width", x(extent[1]) - x(extent[0]));

      dimension.filterRange(extent);

      if (extent[0] && extent[1]) {
        self.model.set('lower', extent[0]);
        self.model.set('upper', extent[1]);
      }

    });

    brush.on("brushend.chart", function() {

      if (brush.empty()) {

        var div = d3.select(this.parentNode.parentNode.parentNode);

        div.select(".legend a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();

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
      axis.scale(x);
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
