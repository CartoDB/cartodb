var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
var template = require('./template.tpl');

/**
 * Standard widget dropdown view
 *
 */
module.exports = cdb.core.View.extend({
  className: 'CDB-Dropdown',

  events: {
    'click .js-pin': '_pin',
    'click .js-toggle': '_toggle',
    'click .js-delete': '_delete'
  },

  initialize: function (opts) {
    if (!opts.target) {
      throw new Error('target is not defined');
    }

    this.viewModel = new cdb.core.Model({ open: false });

    this._$target = this.options.target;
    this._$container = this.options.container;
    this._initBinds();
  },

  render: function () {
    this.$el.html(
      template()
    );

    return this;
  },

  _initBinds: function () {
    this.add_related_model(this.viewModel);

    this.viewModel.bind('change:open', this._onChangeOpen, this);

    this._$target.click(
      _.bind(this._toggleClick, this)
    );
  },

  _bindGlobalClick: function () {
    $(document).bind('click.' + this.cid, _.bind(this._onGlobalClick, this));
  },

  _unbindGlobalClick: function () {
    $(document).unbind('click.' + this.cid);
  },

  _bindESC: function () {
    $(document).bind('keyup.' + this.cid, _.bind(this._onKeyUp, this));
  },

  _unbindESC: function () {
    $(document).unbind('keyup.' + this.cid);
  },

  _onGlobalClick: function (ev) {
    if (this._$target.get(0) !== $(ev.target).closest(this._$target).get(0)) {
      this.viewModel.set('open', false);
    }
  },

  _onKeyUp: function (ev) {
    if (ev.keyCode === 27) {
      this.viewModel.set('open', false);
      return false;
    }
  },

  _onChangeOpen: function () {
    if (this.viewModel.get('open')) {
      this._open();
    } else {
      this._close();
    }
  },

  _delete: function () {
    this.viewModel.set('open', false);
    this.trigger('click', 'delete');
  },

  _pin: function () {
    this.viewModel.set('open', false);
    this.trigger('click', 'pin');
  },

  _toggle: function () {
    this.viewModel.set('open', false);
    this.trigger('click', 'toggle');
  },

  _open: function () {
    this._bindESC();
    this._bindGlobalClick();

    this.render();
    this._$container.append(this.$el);
    this.$el.show();
  },

  _close: function () {
    this._unbindESC();
    this._unbindGlobalClick();
    this.$el.hide();
  },

  _toggleClick: function () {
    this.viewModel.set('open', !this.viewModel.get('open'));
  },

  clean: function () {
    this._unbindESC();
    this._unbindGlobalClick();
    this._$target.off('click');
    cdb.core.View.prototype.clean.call(this);
  }
});
