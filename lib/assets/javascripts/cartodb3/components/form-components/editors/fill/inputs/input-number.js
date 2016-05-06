var cdb = require('cartodb.js');
var template = require('./input-number.tpl');
var InputDialogContent = require('./input-number-dialog-content.js');

module.exports = cdb.core.View.extend({
  className: 'Fill-inputNumber',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._initBinds();

    if (!opts.columns) throw new Error('columns is required');
    this._columns = opts.columns;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.$el.html(template({
      type: this._type,
      value: this.model.get('value'),
      max: this.model.get('max') || '',
      min: this.model.get('min') || ''
    }));

    return this;
  },

  _createContentView: function () {
    var view = new InputDialogContent({
      model: this.model,
      columns: this._columns
    });

    view.bind('change', function (type) {
      this._type = type;
      this.render();
    }, this);

    return view;
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
    this.model.on('change:value', this._onChangeValue, this);
    this.model.on('change:max', this._onChangeValue, this);
    this.model.on('change:min', this._onChangeValue, this);
  },

  _onChangeValue: function () {
    var value = this.model.get('value');

    if (this._type === 'value') {
      value = this.model.get('min') + '..' + this.model.get('max');
    }

    this.$('.js-input').val(value);
  },

  _onToggleSelected: function () {
    this.$el.toggleClass('is-selected', this.model.get('selected'));
  }
});
