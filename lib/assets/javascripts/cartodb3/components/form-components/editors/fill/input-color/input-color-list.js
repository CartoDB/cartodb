var cdb = require('cartodb.js');
var template = require('./input-color-list.tpl');
var InputDialogContent = require('./input-color-dialog-content');

module.exports = cdb.core.View.extend({
  className: 'Fill-inputColorList',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._initBinds();

    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;
  },

  render: function () {
    this.$el.html(template({
      colors: this.model.get('value')
    }));

    return this;
  },

  _createContentView: function () {
    return new InputDialogContent({
      model: this.model,
      columns: this._columns
    });
  },

  _onClick: function (e) {
    this.trigger('click', this.model);
  },

  _initBinds: function () {
    var self = this;

    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);

    this.model.on('change:selected', this._onToggleSelected, this);
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-selected', this.model.get('selected'));
  }
});
