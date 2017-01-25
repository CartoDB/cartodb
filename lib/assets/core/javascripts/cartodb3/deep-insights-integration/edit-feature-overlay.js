var $ = require('jquery');
var _ = require('underscore');
var CoreView = require('backbone/core-view');
var ConfirmationView = require('../components/modals/confirmation/modal-confirmation-view');
var templateConfirmation = require('./start-edition-confirmation.tpl');
var templateEditGeometry = require('./edit-geometry.tpl');
var TipsyTooltipView = require('../components/tipsy-tooltip-view');

var EditFeatureOverlay = CoreView.extend({

  MAX_VERTEXES: 1000,

  className: 'CDB-Overlay',
  type: 'custom',

  events: {
    'click .js-edit-feature': '_onEditButtonClicked'
  },

  initialize: function (options) {
    _.bindAll(this, '_onEditButtonClicked', 'hide', 'show');

    if (!options.map) throw new Error('map is required');
    if (!options.mapModeModel) throw new Error('mapModeModel is required');
    if (!options.modals) throw new Error('modals is required');

    this._map = options.map;
    this._mapModeModel = options.mapModeModel;
    this._modals = options.modals;

    this._map.on('change:center', this.hide, this);
    this._map.on('change:zoom', this.hide, this);

    this._position = {
      x: 0,
      y: 0
    };
  },

  render: function () {
    this.clearSubViews();

    var isEditable = this._isEditable();

    this.$el.html(templateEditGeometry({
      isEditable: isEditable,
      hasAnalyses: this._hasAnalyses(),
      isCustomQueryApplied: this._isCustomQueryApplied(),
      isReadOnly: this._isReadOnly(),
      disabled: this._disabledTooltip()
    }));

    if (!isEditable) {
      var tooltip = new TipsyTooltipView({
        el: this.$('.js-edit-feature'),
        gravity: 's',
        offset: 0,
        title: function () {
          return $(this).data('tooltip');
        }
      });
      this.addView(tooltip);
    }

    return this;
  },

  _disabledTooltip: function () {
    var disabledLayerType;

    if (this._hasAnalyses()) {
      disabledLayerType = _t('editor.edit-feature.analysis');
    } else if (this._isCustomQueryApplied()) {
      disabledLayerType = _t('editor.edit-feature.custom-sql');
    } else if (this._isReadOnly()) {
      disabledLayerType = _t('editor.edit-feature.sync');
    }

    return _t('editor.edit-feature.disabled', { disabledLayerType: disabledLayerType });
  },

  _isEditable: function () {
    return this._featureDefinition && this._featureDefinition.isEditable();
  },

  _hasAnalyses: function () {
    return this._featureDefinition && this._featureDefinition.hasAnalyses();
  },

  _isCustomQueryApplied: function () {
    return this._featureDefinition && this._featureDefinition.isCustomQueryApplied();
  },

  _isReadOnly: function () {
    return this._featureDefinition && this._featureDefinition.isReadOnly();
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

  _getGeomCount: function (geojson) {
    var count = 0;

    _.each(geojson.coordinates, function (pol1, i) {
      _.each(pol1, function (pol2, j) {
        count = count + pol2.length;
      });
    });

    return count;
  },

  _confirmStopEdition: function () {
    var self = this;

    this._modals.create(function (modalModel) {
      return new ConfirmationView({
        modalModel: modalModel,
        template: templateConfirmation,
        runAction: self._startEdition.bind(self)
      });
    });
  },

  _startEdition: function () {
    // Exit editing feature mode to re-enter this mode again
    if (this._mapModeModel.isEditingFeatureMode()) {
      this._mapModeModel.enterViewingMode();
    }
    this._mapModeModel.enterEditingFeatureMode(this._featureDefinition);
  },

  _onEditButtonClicked: function (ev) {
    this.killEvent(ev);
    this.hide();

    var $target = $(ev.target).closest('.js-edit-feature');
    if ($target.hasClass('is-disabled')) {
      return false;
    }

    this._featureDefinition && this._featureDefinition.fetch({
      success: function () {
        var geojson = JSON.parse(this._featureDefinition.get('the_geom'));

        if (this._getGeomCount(geojson) > this.MAX_VERTEXES) {
          this._confirmStopEdition();
        } else {
          this._startEdition();
        }
      }.bind(this),
      error: function () {
        // TODO: Handle errors here!
      }
    });
  }
});

module.exports = EditFeatureOverlay;
