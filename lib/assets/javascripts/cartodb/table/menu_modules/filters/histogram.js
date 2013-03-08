
(function() {

function Histogram(svg) {

  var w = svg.attr('width');
  var h = svg.attr('height');

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

    var bar_width = w/data.length;
    bar.append("rect")
      .attr("x", 1)
      .attr("width", bar_width - 1)
      .attr("height", function(d) { return h - y(d); });
  };

  return _hist;

}

cdb.admin.mod.Filter = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click a.remove': '_remove'
  },

  initialize: function() {
    this.model.bind('change:hist', this._renderHist, this);
  }, 

  render: function() {
    this.$el.width(268).height(75).css('padding', 20);
    this.$el.html(this.getTemplate('table/menu_modules/views/filter')({
      legend: this.model.escape('column')
    }));

    // render hist
    var svg = d3.select(this.el).append("svg")
      .attr("width", this.$el.width())
      .attr("height", this.$el.height());

    this.hist = Histogram(svg);
    this._renderHist();

    return this;
  },

  _renderHist: function() {
    var h = this.model.get('hist');
    if(h) { 
      this.hist.update(h);
      this.$('.range').html(h.lower + "-" + h.upper);
    }
  },

  _remove: function(e) {
    this.killEvent(e);
    this.model.destroy();
  }

});

})();
