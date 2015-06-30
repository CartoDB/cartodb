var cdb = require('cartodb.js');

/**
 *  Templated workflows list item
 *
 *
 */

module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'MapsList-item',

  events: {
    'click': '_onClick'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/templated_workflows/templated_workflows_list_item');
  },

  render: function() {
    var d = {
      name: this.model.get('name'),
      description: this.model.get('description'),
      visualizationParentId: this.model.get('visualization_parent_id'),
      timesUsed: this.model.get('times_used') 
    };
    this.$el.html(this.template(d));
    return this;
  },

  _onClick: function() {
    this.trigger('onSelected', this.model, this);
  }

});
