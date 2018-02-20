var _ = require('underscore');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./analysis-option.tpl');
var Analyses = require('builder/data/analyses');

/**
 * View for an individual analysis option.
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'ModalBlockList-item',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave',
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._simpleGeometryTypeInput = opts.simpleGeometryTypeInput; // might be undefined/null, so don't check

    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    var props = this.model.pick('title', 'type_group', 'desc', 'selected', 'link');

    props.enabled = this._acceptsInputGeometry();

    if (!props.enabled) {
      props.desc = this._disabledDesc();
    }

    var analysisType = this.model.get('type');
    var analysisItem = Analyses.getAnalysisByType(analysisType);
    var animationTemplate = analysisItem && analysisItem.animationTemplate;
    var genericType = '';

    if (animationTemplate) {
      genericType = analysisItem.genericType || analysisType;
    }

    this.$el.html(template(_.extend(props, { type: genericType })));

    if (animationTemplate) {
      this.$('.js-animation').append(animationTemplate);
    }

    this.$el.toggleClass('is-selected', this.model.get('selected'));
    this.$el.toggleClass('is-disabled', !props.enabled);

    return this;
  },

  _onMouseEnter: function () {
    if (this._acceptsInputGeometry()) {
      this.$('.js-animation').addClass('has-autoplay');
    }
  },

  _onMouseLeave: function () {
    if (this._acceptsInputGeometry()) {
      this.$('.js-animation').removeClass('has-autoplay');
    }
  },

  _onClick: function (event) {
    var linkClicked = event && event.target && $(event.target).hasClass('js-more');
    if (!linkClicked && this._acceptsInputGeometry()) {
      this.model.set('selected', true);
    }
  },

  _disabledDesc: function (desc) {
    return _t('components.modals.add-analysis.disabled-option-desc', {
      simpleGeometryType: this._simpleGeometryTypeInput || _t('components.modals.add-analysis.unknown-geometry-type'),
      requiredInputGeometries: this._getRequiredInputGeometries()
    });
  },

  _getRequiredInputGeometries: function () {
    return _t('components.modals.add-analysis.geometry-types.' + this.model.getValidInputGeometries());
  },

  _acceptsInputGeometry: function () {
    return this.model.acceptsGeometryTypeAsInput(this._simpleGeometryTypeInput);
  }

});
