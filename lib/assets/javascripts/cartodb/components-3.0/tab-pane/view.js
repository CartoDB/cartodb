var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  TabPane component
 */


module.exports = cdb.core.View.extend({

  className: 'TabPane',

  templateName: 'components-3.0/tab-pane/template',

  initialize: function(options) {

    if (!this.options.collection) {
      throw new Error('a TabPaneCollection should be provided');
    }

    this.template = cdb.templates.getTemplate(this.options.template || this.templateName);
  },

  render: function() {

    this.$el.append(this.template());

    this._renderCollection();
    this.collection.setSelected();

    return this;
  },

  _renderCollection() {
    this.collection.each(function(paneModel) {
      this.$('.js-menu').append(paneModel.get('itemView'));
      this.$('.js-content').append(paneModel.get('content'));
    });
  }

});


