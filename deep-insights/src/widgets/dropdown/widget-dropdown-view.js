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
    'click .js-toggleLocalTimezone': '_toggleLocalTimezone',
    'click .js-toggleNormalized': '_toggleNormalized',
    'click .js-toggleCollapsed': '_toggleCollapsed',
    'click .js-removeWidget': '_removeWidget',
    'click .js-editWidget': '_editWidget'
  },

  initialize: function (opts) {
    if (!opts.target) {
      throw new Error('target is not defined');
    }

    this._target = this.options.target;
    this._$container = this.options.container;

    this._initBinds();
  },

  render: function () {
    var flags = _.defaults(
      this.options.flags || {}, {
        canCollapse: true
      }
    );

    var templateData = _.defaults({},
      this.model.attributes, {
        flags: flags
      }, {
        'local_timezone': false,
        'normalized': false,
        'collapsed': false,
        'show_options': false
      }
    );

    this.$el.html(template(templateData));
    return this;
  },

  _initBinds: function () {
    this.add_related_model(this.model);

    this.model.bind('change:widget_dropdown_open', this._onChangeOpen, this);

    this._$container.delegate(this._target, 'click', _.bind(this._toggleClick, this));
  },

  _removeWidget: function () {
    this.model.trigger('removeWidget', this.model);
  },

  _editWidget: function () {
    this.model.trigger('editWidget', this.model);
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
    var target = this._$container.find(this._target);
    if (target.get(0) !== $(ev.target).closest(target).get(0)) {
      this.model.set('widget_dropdown_open', false);
    }
  },

  _onKeyUp: function (ev) {
    if (ev.keyCode === 27) {
      this.model.set('widget_dropdown_open', false);
      return false;
    }
  },

  _onChangeOpen: function () {
    if (this.model.get('widget_dropdown_open')) {
      this._open();
    } else {
      this._close();
    }
  },

  _toggleCollapsed: function () {
    var collapsed = !this.model.get('collapsed');
    this.model.set('collapsed', collapsed);
  },

  _toggleNormalized: function () {
    var normalized = !this.model.get('normalized');
    this.model.set('normalized', normalized);
  },

  _toggleLocalTimezone: function () {
    var localTimezone = !this.model.get('local_timezone');
    this.model.set('local_timezone', localTimezone);
  },

  _open: function () {
    this._bindESC();
    this._bindGlobalClick();

    this.render();
    this._$container.append(this.$el);
    this.$el.show();

    this._adjustVerticalPosition();
  },

  _adjustVerticalPosition: function () {
    if (this._getDropdownBottom() > this._getBodyHeight()) {
      this.$el.addClass('has-top-position');
    }
  },

  _getDropdownBottom: function () {
    return this.$el.offset().top + this.$el.height();
  },

  _getBodyHeight: function () {
    return $('body').height();
  },

  _close: function () {
    this._unbindESC();
    this._unbindGlobalClick();
    this.$el.hide();
    this.$el.removeClass('has-top-position');
  },

  _toggleClick: function () {
    this.model.set('widget_dropdown_open', !this.model.get('widget_dropdown_open'));
  },

  clean: function () {
    this.model.set('widget_dropdown_open', false);
    this._unbindESC();
    this._unbindGlobalClick();
    this._$container.undelegate(this._target, 'click');
    cdb.core.View.prototype.clean.call(this);
  }
});
