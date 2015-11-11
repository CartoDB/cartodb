var $ = require('jquery');
var WidgetContentView = require('../standard/widget_content_view.js');
var ControlsView = require('./controls-view');
var StepInfoView = require('./step-info-view');
var HistogramChartView = require('../histogram/chart');

module.exports = WidgetContentView.extend({

  defaults: {
    chartHeight:
      48 // inline bars height
      + 20 // bottom labels
      + 4 // margins
  },

  initialize: function() {
      var data = [{"bin":0,"start":38331,"end":45855.1,"freq":1,"min":38331,"max":38331},{"bin":1,"start":45855.1,"end":53379.2,"freq":1,"min":53968,"max":53968},{"bin":2,"start":53379.2,"end":60903.3,"freq":1,"min":55611,"max":55611},{"bin":3,"start":60903.3,"end":68427.4,"freq":1,"min":70151,"max":70151},{"bin":4,"start":68427.4,"end":75951.5,"freq":2,"min":78448,"max":79017},{"bin":5,"start":75951.5,"end":83475.6,"freq":1,"min":87877,"max":87877},{"bin":6,"start":83475.6,"end":90999.70000000001,"freq":0},{"bin":7,"start":90999.70000000001,"end":98523.8,"freq":0},{"bin":8,"start":98523.8,"end":106047.90000000001,"freq":0},{"bin":9,"start":106047.90000000001,"end":113572,"freq":1,"min":113572,"max":113572}];
      this.model.set('data', data);
    this.model.bind('change:play', this._onChangePlay, this);
    this.model.bind('change:data', this.render, this);

    // TODO set later
    // setTimeout(function() {
    //   var data = [{"bin":0,"start":38331,"end":45855.1,"freq":1,"min":38331,"max":38331},{"bin":1,"start":45855.1,"end":53379.2,"freq":1,"min":53968,"max":53968},{"bin":2,"start":53379.2,"end":60903.3,"freq":1,"min":55611,"max":55611},{"bin":3,"start":60903.3,"end":68427.4,"freq":1,"min":70151,"max":70151},{"bin":4,"start":68427.4,"end":75951.5,"freq":2,"min":78448,"max":79017},{"bin":5,"start":75951.5,"end":83475.6,"freq":1,"min":87877,"max":87877},{"bin":6,"start":83475.6,"end":90999.70000000001,"freq":0},{"bin":7,"start":90999.70000000001,"end":98523.8,"freq":0},{"bin":8,"start":98523.8,"end":106047.90000000001,"freq":0},{"bin":9,"start":106047.90000000001,"end":113572,"freq":1,"min":113572,"max":113572}];
    //   this.model.set('data', data);
    // }.bind(this), 500);
  },

  render: function() {
    this.clearSubViews();
    this.$el.html('');
    this._appendView(
      new ControlsView({
        model: this.model
      })
    );
    this._appendView(
      new StepInfoView({
        model: this.model
      })
    );

    if (this.model.get('data')) {
      this._createHistogramChartView();
    }

    return this;
  },

  _createHistogramChartView: function() {
    var view = new HistogramChartView({
      y: 0,
      margin: { top: 4, right: 4, bottom: 20, left: 4 },
      handles: true,
      width: 500||this.$el.width(), // TODO remove margins?
      height: this.defaults.chartHeight,
      data: this.model.get('data')
      // data: this.dataModel.getDataWithOwnFilterApplied()
    });
    this._appendView(view);
    view.show();
    // view.render().show();
  },

  _appendView: function(view) {
    this.addView(view);
    this.$el.append(view.el);
    view.render();
  },

  _onChangePlay: function() {
    // TODO replace with real state changing
    if (this.model.get('play')) {
      this._theInterval = setInterval(function() {
        this.model.set('step', new Date());
      }.bind(this), 500)
    } else {
      clearInterval(this._theInterval);
    }
  }

});
