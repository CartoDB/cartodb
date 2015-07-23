var RowView = require('../row_view');

/**
 * Special view for the street addresses georeference option
 * This allows to potentially add more
 */
module.exports = RowView.extend({

  events: RowView.extendEvents({
    'click .js-add-row': '_onClickAddRow'
  }),

  initialize: function() {
    RowView.prototype.initialize.apply(this, arguments);
    this._initStreetRowBinds();
  },

  render: function() {
    RowView.prototype.render.call(this);
    if (!this.model.get('disabled')) {
      this.$el.append(
        this.getTemplate('common/dialogs/georeference/street_addresses/row_add_row')()
      );
    }
    return this;
  },

  _initStreetRowBinds: function() {
    this.model.bind('change:canAddRow', this._onChangeCanAddRow, this);
  },

  _onClickAddRow: function(ev) {
    this.killEvent(ev);
    this.model.addRow();
  },

  _onChangeCanAddRow: function(m, canAddRow) {
    this.$('.js-add-row').toggle(!!canAddRow);
  }

});
