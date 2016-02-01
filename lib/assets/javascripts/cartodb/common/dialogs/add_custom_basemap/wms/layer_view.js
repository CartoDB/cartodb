var cdb = require('cartodb.js-v3');

/**
 * View for an individual layer item.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'List-row',

  events: {
    'click .js-add': '_onClickAdd'
  },

  render: function() {
    this.$el.html(
      cdb.templates.getTemplate('common/dialogs/add_custom_basemap/wms/layer')({
        model: this.model,
        canSave: this.model.canSave(this.options.baseLayers)
      })
    );
    return this;
  },

  _onClickAdd: function(ev) {
    this.killEvent(ev);
    if (this.model.canSave(this.options.baseLayers)) {
      this.model.save();
    }
  }

});
