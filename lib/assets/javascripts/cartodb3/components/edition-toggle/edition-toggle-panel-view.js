var cdb = require('cartodb.js');
var _ = require('underscore');
var TabPaneView = require('../tab-pane/tab-pane-view');
var TabPaneCollection = require('../tab-pane/tab-pane-collection');
var EditionToggleBarView = require('./edition-toggle-bar-view');
var Template = require('./edition-toggle-panel.tpl');

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
    var self = this;
    this._layerTabPaneView = new TabPaneView(
      _.extend({
        collection: self.collection,
        template: function () {
          return Template;
        }
      })
    );

    this.$el.append(this._layerTabPaneView.render().$el);
    this.addView(this._layerTabPaneView);

    var editionBarView = new EditionToggleBarView({
      collection: this.collection
    });

    this.$el.append(editionBarView.render().el);
    this.addView(editionBarView);

    return this;
  }
});
