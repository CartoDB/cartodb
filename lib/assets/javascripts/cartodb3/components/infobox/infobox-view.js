var cdb = require('cartodb.js');
var template = require('./infobox.tpl');
var templateButton = require('./infobox-button.tpl');

module.exports = cdb.core.View.extend({
  className: 'Infobox',

  events: {
    'click .js-primary .js-action': '_onPrimaryClick',
    'click .js-secondary .js-action': '_onSecondaryClick'
  },

  initialize: function (opts) {
    if (!opts.statesCollection) throw new Error('States collection is required');
    this.statesCollection = opts.statesCollection;
    this.selectedModel = this.statesCollection.getSelected();
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this.selectedModel = this.statesCollection.getSelected();
    this._initViews();
    return this;
  },

  toggle: function (m, isVisible) {
    isVisible ? this._show() : this._hide();
  },

  _initBinds: function () {
    this.listenTo(this.statesCollection, 'change:state', this.render);
    this.add_related_model(this.statesCollection);
  },

  _initViews: function () {
    var $el = template({
      type: this.selectedModel.type(),
      title: this.selectedModel.title(),
      body: this.selectedModel.body()
    });

    this.$el.append($el);

    if (this.selectedModel.primaryButton() !== false) {
      this._primaryButton().html(templateButton(this.selectedModel.primaryButton()));
    }

    if (this.selectedModel.secondaryButton() !== false) {
      this._secondaryButton().html(templateButton(this.selectedModel.secondaryButton()));
    }
  },

  _onPrimaryClick: function () {
    this.selectedModel.primaryAction();
  },

  _onSecondaryClick: function () {
    this.selectedModel.secondaryAction();
  },

  _primaryButton: function () {
    return this.$('.js-primary');
  },

  _secondaryButton: function () {
    return this.$('.js-secondary');
  }
});
