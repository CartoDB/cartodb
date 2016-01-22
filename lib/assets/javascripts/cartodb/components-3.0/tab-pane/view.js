var cdb = require('cartodb.js');
var Backbone = require('backbone');
var TabPaneItem = require('./item/view.js');
var TabPaneContent = require('./content/view.js');

/**
 *  TabPane component
 */


module.exports = cdb.core.View.extend({

  className: 'TabPane',

  templateName: 'components-3.0/tab-pane/template',

  initialize: function(options) {

    if (!this.collection) {
      throw new Error('A TabPaneCollection should be provided');
    }

    this.template = cdb.templates.getTemplate(this.options.template || this.templateName);
  },

  render: function() {

    this.$el.append(this.template());

    this._renderCollection();

    return this;
  },

  _renderCollection() {
    this.collection.each(function(paneModel) {
      var tabPaneItemView = new TabPaneItem({ model: paneModel });
      this.addView(tabPaneItemView);
      this.$('.js-menu').append(tabPaneItemView.render().$el);

      var tabPaneContentView = new TabPaneContent({ model: paneModel });
      this.addView(tabPaneContentView);
      this.$('.js-content').append(tabPaneContentView.render().$el);
    }, this);
  }
});


