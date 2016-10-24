var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');

var EditFeatureOverlay = CoreView.extend({
  className: 'CDB-Overlay',
  type: 'custom',
  template: '<button class="CDB-Attribution-button js-edit-feature">?</button>',

  events: {
    'click .js-edit-feature': '_onEditButtonClicked'
  },

  initialize: function (options) {
    _.bindAll(this, '_onEditButtonClicked', 'hide', 'show');

    if (!options.map) throw new Error('map is required');
    if (!options.mapModeModel) throw new Error('mapModeModel is required');
    this._map = options.map;
    this._mapModeModel = options.mapModeModel;

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

  hide: function (event) {
    this.killEvent(event);
    this.$el.hide();
    $(document).off('click', this.hide);
  },

  show: function () {
    this.$el.css({
      width: '20px',
      top: this._position.y,
      left: this._position.x,
      position: 'absolute'
    });
    this.$el.show();

    $(document).on('click', this.hide);
  },

  setPosition: function (position) {
    this._position = position;
  },

  setFeatureDefinition: function (featureDefinition) {
    this._featureDefinition = featureDefinition;
  },

  getFeatureDefinition: function () {
    return this._featureDefinition;
  },

  _onEditButtonClicked: function (event) {
    this.killEvent(event);
    this.hide();

    this._featureDefinition && this._featureDefinition.fetch({
      success: function () {
        // Exit editing feature mode to re-enter this mode again
        if (this._mapModeModel.isEditingFeatureMode()) {
          this._mapModeModel.enterViewingMode();
        }
        this._mapModeModel.enterEditingFeatureMode(this._featureDefinition);
      }.bind(this),
      error: function () {
        // TODO: Handle errors here!
      }
    });
  }
});

module.exports = EditFeatureOverlay;
