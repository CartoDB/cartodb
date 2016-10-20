var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var EditFeatureOverlay = Backbone.View.extend({
  className: 'CDB-Overlay',
  type: 'custom',
  template: '<p class="js-edit-feature">Edit</p>',

  events: {
    'click .js-edit-feature': '_onEditButtonClicked'
  },

  initialize: function (options) {
    _.bindAll(this, '_onEditButtonClicked');

    if (!options.map) throw new Error('map is required');
    this._map = options.map;

    this._map.on('change:center', this.hide, this);
    this._map.on('change:zoom', this.hide, this);

    this._position = {
      x: 0,
      y: 0
    };
  },

  render: function () {
    this.$el.html(this.template);
    return this;
  },

  hide: function () {
    this.$el.hide();
    $(document.body).off('click', this.hide.bind(this));
  },

  show: function () {
    this.$el.css({
      width: '20px',
      top: this._position.y,
      left: this._position.x
    });
    this.$el.show();

    $(document.body).on('click', this.hide.bind(this));
  },

  setPosition: function (position) {
    this._position = position;
  },

  _onEditButtonClicked: function (event) {
    event.stopPropagation();
    this.hide();
    this.trigger('editFeature');
  }
});

module.exports = EditFeatureOverlay;
