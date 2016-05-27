var cdb = require('cartodb.js');
var template = require('./analysis-option.tpl');

/**
 * View for an individual analysis option.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'ModalBlockList-item',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.simpleGeometryTypeInput) throw new Error('simpleGeometryTypeInput is required');

    this._simpleGeometryTypeInput = opts.simpleGeometryTypeInput;

    this.listenTo(this.model, 'change:selected', this.render);
  },

  render: function () {
    var props = this.model.pick('title', 'type_group', 'desc', 'selected');

    props.enabled = this._acceptsInputGeometry();
    if (!props.enabled) {
      props.desc = this._disabledDesc();
    }

    this.$el.html(template(props));

    this.$el.toggleClass('is-selected', this.model.get('selected'));
    this.$el.toggleClass('is-disabled', !props.enabled);

    return this;
  },

  _onClick: function () {
    if (this._acceptsInputGeometry()) {
      this.model.set('selected', true);
    }
  },

  _disabledDesc: function (desc) {
    return _t('components.modals.add-analysis.disabled-option-desc', {
      simpleGeometryType: this._simpleGeometryTypeInput,
      requiredInputGeometries: this.model.getValidInputGeometries()
    });
  },

  _acceptsInputGeometry: function () {
    return this.model.acceptsGeometryTypeAsInput(this._simpleGeometryTypeInput);
  }

});
