var cdb = require('cartodb.js');
var Backbone = require('backbone');

/**
 *  TabPaneItem component
 */

module.exports = cdb.core.View.extend({

  className: 'TabPaneItem',

  templateName: 'components-3.0/tab-pane/item/template',

  events: {
    'click .js-button': '_onButtonClicked'
  },

  initialize: function(options) {

    this.template = cdb.templates.getTemplate(this.options.template || this.templateName);
  },

  render: function() {

    this.$el.append(this.template());

    return this;
  },

  _onButtonClicked: function() {
    this.trigger('buttonClicked', this);
  }
});
