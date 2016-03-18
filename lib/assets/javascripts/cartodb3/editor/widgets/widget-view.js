var cdb = require('cartodb-deep-insights.js');
var template = require('./widget-view.tpl');

var widgetIconTemplateMap = {
  category: require('./widget-icon-category.tpl'),
  histogram: require('./widget-icon-histogram.tpl'),
  formula: require('./widget-icon-formula.tpl'),
  'time-slider': require('./widget-icon-timeSlider.tpl')
};

/**
 * View for an individual widget definition model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'BlockList-item js-widgetItem',

  events: {
    'click .js-remove': '_onRemove',
    'click': '_onEdit'
  },

  initialize: function (opts) {
    if (!opts.layer) throw new Error('layer is required');
    this.layer = opts.layer;
    this.stackLayoutModel = opts.stackLayoutModel;

    this.listenTo(this.model, 'change', this.render);
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    var widgetType = this.model.get('type');
    this.$el.html(template({
      widgetType: widgetType,
      layerName: this.layer.getName(),
      title: this.model.get('title')
    }));
    this.$el.attr('data-model-cid', this.model.cid);

    var iconTemplate = widgetIconTemplateMap[widgetType];

    if (!iconTemplate) {
      console.log(widgetType + ' widget template not defined');
    } else {
      this.$('.js-widgetIcon').append(iconTemplate());
    }

    return this;
  },

  _onEdit: function () {
    this.stackLayoutModel.nextStep(this.model, 'widgets');
  },

  _onRemove: function (ev) {
    this.killEvent(ev); // to avoid the general click to trigger (i.e. do not try to edit on removal)
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
