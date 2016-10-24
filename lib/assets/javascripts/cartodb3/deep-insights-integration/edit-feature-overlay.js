var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');

var EditFeatureOverlay = CoreView.extend({
  className: 'CDB-Overlay',
  type: 'custom',
  template: '<button class="CDB-Attribution-button js-edit-feature"><svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M10 22.91l1.217-3.65 8.924-8.924c.448-.448 1.177-.448 1.624 0l.81.81c.448.448.448 1.175 0 1.623l-8.923 8.924L10 22.91zm10.952-8.518l-2.434-2.434 2.434 2.434zm-7.3 7.302l-2.435-2.434 2.434 2.434z" stroke="#636D72" fill="none" fill-rule="evenodd"/></svg></button>',

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
