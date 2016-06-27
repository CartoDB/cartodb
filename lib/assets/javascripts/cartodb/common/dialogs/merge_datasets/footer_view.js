var cdb = require('cartodb.js-v3');

/**
 * View that represents the footer.
 * May contain an additional info view with more state details depending on context.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-next': '_onClickNext'
  },

  initialize: function() {
    if (this.options.infoView) {
      this.addView(this.options.infoView);
    }
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.getTemplate('common/dialogs/merge_datasets/footer')({
        nextLabel: this.options.nextLabel || 'next step'
      })
    );
    this._onChangeIsReadyForNextStep(this.model, this.model.get('isReadyForNextStep'));
    this._maybeRenderInfoView();
    return this;
  },

  _maybeRenderInfoView: function() {
    if (this.options.infoView) {
      this.$('.js-info').append(this.options.infoView.render().$el);
    }
  },

  _initBinds: function() {
    this.model.bind('change:isReadyForNextStep', this._onChangeIsReadyForNextStep, this);
  },

  _onChangeIsReadyForNextStep: function(model, isReady) {
    this.$('.js-next').toggleClass('is-disabled', !isReady);
  },

  _onClickNext: function() {
    if (this.model.get('isReadyForNextStep')) {
      this.model.set('gotoNextStep', true);
    }
  }

});
