var CoreView = require('backbone/core-view');
var ViewFactory = require('builder/components/view-factory');
var template = require('./feedback-button.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');
var feedbackModalTemplate = require('./feedback-modal.tpl');

module.exports = CoreView.extend({

  tagName: 'button',
  className: 'EditorMenu-feedback typeform-share button js-feedback',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.modals) throw new Error('modals is required');
    this._modals = opts.modals;
  },

  render: function () {
    this.clearSubViews();
    this.el.setAttribute('data-mode', '1');
    this.el.setAttribute('target', '_blank');

    this.$el.append(template());

    var tooltip = new TipsyTooltipView({
      el: this.el,
      gravity: 'w',
      title: function () {
        return _t('feedback');
      }
    });
    this.addView(tooltip);

    return this;
  },

  _onClick: function () {
    this.$el.blur();
    this._createView();
  },

  _createView: function () {
    this._modals.once('destroyedModal', this.clean, this);
    this._modals.create(function (modalModel) {
      var view = ViewFactory.createByTemplate(feedbackModalTemplate, null, {
        className: 'Editor-feedbackModal'
      });
      // Set focus to the iframe after 3 seconds.
      // This is required to enable Enter key event
      setTimeout(function () {
        view.$el.find('iframe').focus();
      }, 3000);
      return view;
    });
  }
});
