
(function() {

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

cdb.admin.mod.Filter = cdb.core.View.extend({

  tagName: 'li',
  className: 'histogram_filter',

  events: {
    'click a.remove': '_remove'
  },

  initialize: function() {
    this.model.bind('change:hist', this._renderHist, this);
    this.model.bind('change:upper change:lower', this._renderRange, this);
  }, 

  render: function() {
    var self = this;
    this.$el.width(268).height(75).css('padding', 20);
    this.$el.html(this.getTemplate('table/menu_modules/views/filter')({
      legend: this.model.escape('column')
    }));

    // render hist
    var svg = d3.select(this.$('.hist')[0]).append("svg")
      .attr("width", this.$el.width())
      .attr("height", this.$el.height());

    // add range slides
    this.leftSlider = new SliderControl({
      className: 'left_slider',
      position: -1
    });

    this.rigthSlider = new SliderControl({
      className: 'right_slider',
      position: this.$el.width()
    });

    this.leftSlider.bind('move', function(pos) {
      self.model.set('lower', self.qtyFromSliderPos(pos));
    });

    this.rigthSlider.bind('move', function(pos) {
      self.model.set('upper', self.qtyFromSliderPos(pos));
    });

    this.hist = Histogram(svg);
    this._renderHist();

    this.$('.hist').append(this.rigthSlider.el).append(this.leftSlider.el);
    this.addView(this.rigthSlider);
    this.addView(this.leftSlider);

    return this;
  },

  qtyFromSliderPos: function(pos) {
    var t = pos/this.hist.width();
    return this.model.interpolate(t);
  },

  _renderHist: function() {
    var h = this.model.get('hist');
    if(h) { 
      this.hist.update(h);
    }
  },

  _renderRange: function() {
    this.$('.range').html(this.model.get('lower') + "-" + this.model.get('upper'));
    //this.leftSlider.bar_width(this.hist.bar_width());
    var base = this.$el.offset();
    this.leftSlider.set_constrain(base.left, base.left + this.hist.width());
    this.rigthSlider.set_constrain(base.left, base.left + this.hist.width());

  },

  _remove: function(e) {
    this.killEvent(e);
    this.model.destroy();
  }

});

})();
