var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./infowindow-field.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

/**
 * View for an individual column model.
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'js-field Infowindow-listFieldItem',

  events: {
    'click .js-checkbox': 'toggle',
    'keyup .js-input': '_onKeyUp',
    'blur .js-input': '_onBlur'
  },

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;

    this.fieldName = opts.field.name;
    this.fieldTitle = opts.field.title;
    this.position = opts.position;

    this._layerInfowindowModel.bind('change:fields', this.render, this);

    this.model = new Backbone.Model({
      title: this._layerInfowindowModel.getAlternativeName(this.fieldName) || this.fieldName,
      selected: !!this._layerInfowindowModel.containsField(this.fieldName)
    });
    this.model.bind('change:title', this._updateTitle, this);
    this.model.bind('change:selected', this._updateSelected, this);
  },

  _onBlur: function (e) {
    var value = this.$el.find('.js-input').val();
    value = this._stripHTML(value);

    this.model.set('title', value);
  },

  _updateTitle: function () {
    var value = this.model.get('title');
    value = this._stripHTML(value);
    this._layerInfowindowModel.setAlternativeName(this.fieldName, value);

    var isBlank = this._isBlank(value);
    this._layerInfowindowModel.setFieldProperty(this.fieldName, 'title', !isBlank);
  },

  _onKeyUp: function (e) {
    if (e.keyCode === 13) { // Enter
      var value = this.$el.find('.js-input').val();
      value = this._stripHTML(value);

      this.model.set('title', value);
    // } else if (e.keyCode === 27) { // Esc
    //   this._close();
    }
  },

  _isBlank: function (str) {
    return (!str || /^\s*$/.test(str));
  },

  _stripHTML: function (input, allowed) {
    allowed = (((allowed || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    if (!input || (typeof input !== 'string')) return '';
    return input.replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      name: this.fieldName,
      title: this._layerInfowindowModel.getFieldProperty(this.fieldName, 'title'),
      alternativeName: this._layerInfowindowModel.getAlternativeName(this.fieldName),
      isSelected: !!this._layerInfowindowModel.containsField(this.fieldName)
    }));
    this.$el.attr('data-view-cid', this.cid);

    this._initViews();

    return this;
  },

  _initViews: function () {
    var tooltip = new TipsyTooltipView({
      el: this.$('.js-input'),
      gravity: 'w',
      title: function () {
        return _t('editor.layers.infowindow.items.help');
      }
    });
    this.addView(tooltip);
  },

  toggle: function (e) {
    e && e.preventDefault();

    this.model.set('selected', !this.model.get('selected'));

    return false;
  },

  _updateSelected: function (e) {
    if (!this._layerInfowindowModel.containsField(this.fieldName)) {
      this._layerInfowindowModel.addField(this.fieldName, this.position);
    } else {
      this.model.set('title', null);
      this._layerInfowindowModel.removeField(this.fieldName);
    }
  }

});
