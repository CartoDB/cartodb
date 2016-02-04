var cdb = require('cartodb-deep-insights.js');
var template = require('./editor-widget.tpl');
var WidgetFormView = require('../widgets-form/widgets-form-view');

/**
 * View for an individual widget defintion.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .js-remove': '_onRemove',
    'click .js-edit': '_onEdit'
  },

  initialize: function () {
    this.listenToOnce(this.model, 'destroy', this._onDestroy);
  },

  render: function () {
    this.$el.html(template({
      title: this.model.get('title')
    }));
    return this;
  },

  _onEdit: function () {
    var view = new WidgetFormView({
      widgetDefinitionModel: this.model
    });
    this.$el.append(view.render().$el);
  },

  _onRemove: function () {
    this.model.destroy();
  },

  _onDestroy: function () {
    this.clean();
  }
});
