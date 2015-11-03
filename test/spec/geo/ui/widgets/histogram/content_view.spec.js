describe('widgets/histogram/content_view', function() {

  beforeEach(function() {
    debugger
    this.dataModel = new cdb.geo.ui.Widget.HistogramModel({
      id: 'widget_3',
      options: {
        title: 'Howdy',
        columns: ['cartodb_id', 'title']
      }
    });

    this.viewModel = new cdb.core.Model({
      sync: true
    });

    this.filter = new cdb.core.Model({
      min: 0,
      max: 100
    });

    this.view = new cdb.geo.ui.Widget.Histogram.Content({
      viewModel: this.viewModel,
      dataModel: this.dataModel,
      filter: this.filter
    });
  });

  it('should render the histogram', function() {
    spyOn(this.view, 'render').and.callThrough();
    this.dataModel._data.reset(genData(20));
    this.dataModel.trigger('change:data');
    expect(this.view.render).toHaveBeenCalled();
    //expect(_.size(this.view._subviews)).toBe(3);
    //expect(_.size(this.view._list)).toBeDefined();
    //expect(_.size(this.view._paginator)).toBeDefined();
    //expect(_.size(this.view._edges)).toBeDefined();
  });

});

function genData(n) {
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
