describe('widgets/histogram/chart', function() {

  afterEach(function() {
    //$('.js-chart').remove();
  });

  beforeEach(function() {
    d3.select("body").append("svg").attr('class', 'js-chart');
    this.data = genHistogramData(20);
    this.width = 300;
    this.margin = { top: 4, right: 4, bottom: 20, left: 4 };

    this.view = new cdb.geo.ui.Widget.Histogram.Chart(({
      el: $('.js-chart'),
      y: 0,
      margin: this.margin,
      handles: true,
      width: this.width,
      height: 100,
      data: this.data
    }));
    window.chart = this.view;
  });

  it('should calculate the width of the bars', function() {
    this.view.render().show();
    expect(this.view.barWidth).toBe((this.width - this.margin.left - this.margin.right) / this.data.length);
  });
});

function genHistogramData(n) {
  n = n || 1;
  var arr = [];
  _.times(n, function(i) {
    var start = (100 * i) + Math.round(Math.random() * 1000);
    var end = start + 100;
    var obj = {
      bin: i,
      freq: Math.round(Math.random() * 10),
      start: start,
      end: end,
      max: end,
      min: start
    };
    arr.push(obj);
  });
  return arr;
}
