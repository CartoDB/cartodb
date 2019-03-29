const CoreView = require('backbone/core-view');
const template = require('./interval-template.tpl');

/**
 * Sync interval
 */
module.exports = CoreView.extend({
  tagName: 'li',
  className: 'Modal-listFormItem',

  events: {
    'click': '_onClick'
  },

  initialize: function () {
    this._setupModel();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template(this.model.attributes));
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:checked', this._onToggleChecked);
  },

  _setupModel: function () {
    this.model = this.options.model;
    this.model.set('id', this.cid);
  },

  _onClick: function (e) {
    this.killEvent(e);

    if (!this.model.get('disabled')) {
      this.model.set('checked', true);
      this.trigger('checked', this.model, this);
    }
  },

  _onToggleChecked: function () {
    this.render();
  }
});
