var cdb = require('cartodb.js');
var TabPaneView = require('../../../components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../components/tab-pane/tab-pane-collection');
var OptionsBarView = require('./options-bar-view');
var template = require('./panel-with-options.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.panes) {
      throw new Error('A TabPaneCollection should be provided');
    }

    if (opts.panes.length > 2) {
      throw new Error('Only two panes are allow for a toggler edition view');
    }

    this.collection = new TabPaneCollection(opts.panes);
  },

  render: function () {
    var layerTabPaneView = new TabPaneView({
      collection: this.collection,
      template: function () {
        return template;
      }
    });

    this.$el.append(layerTabPaneView.render().el);
    this.addView(layerTabPaneView);

    var optionsBarView = new OptionsBarView({
      collection: this.collection
    });

    this.$el.append(optionsBarView.render().el);
    this.addView(optionsBarView);

    return this;
  }
});
