var cdb = require('cartodb.js');
var TemplatedWorkflowsListItemView = require('./templated_workflows_list_item_view');

/**
 *  Templated workflows list view
 *
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    var $ul = $('<ul>').addClass('MapsList js-list');
    this.$el.append($ul);
    this.collection.each(this._addTemplateItem, this);
    return this;
  },

  _initBinds: function() {
    this.collection.bind('reset', this.render, this);
    this.add_related_model(this.collection);
  },

  _addTemplateItem: function(mdl) {
    var v = new TemplatedWorkflowsListItemView({
      model: mdl
    });
    v.bind('onSelect', function(mdl) {
      this.trigger('onSelect', mdl, this);
    }, this);

    this.$('.js-list').append(v.render().el);
    this.addView(v);
  }

});
