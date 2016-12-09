var cdb = require('cartodb.js');
var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./builder-view.tpl');

var BUILDER_KEY = 'onboarding';

var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

module.exports = CoreView.extend({
  className: 'BuilderOnboarding is-step0 is-opening',

  events: {
    'click .js-start': '_onClickNext',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.onboardingNotification) throw new Error('onboardingNotification is required');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;
    this._editorModel = opts.editorModel;
    this._onboardingNotification = opts.onboardingNotification;
    this.model = new cdb.core.Model({
      step: 0
    });

    this.model.bind('change:step', this._onChangeStep, this);

    this._keyDown = this._onKeyDown.bind(this);
    $(document).on('keydown', this._keyDown);

    this._initBinds();
  },

  render: function () {
    this.$el.html(template({
      name: this._userModel.get('name') || this._userModel.get('username')
    }));

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'destroy', this._close);
    this.listenTo(this._editorModel, 'change:edition', this._changeEdition);
    this.add_related_model(this._editorModel);
  },

  _changeEdition: function (mdl) {
    var isEditing = !!mdl.get('edition');
    this.$el.toggleClass('is-editing', isEditing);
  },

  _prev: function () {
    if (this.model.get('step') >= 1) {
      this.model.set('step', this.model.get('step') - 1);
    }
  },

  _next: function () {
    if (this.model.get('step') <= 3) {
      this.model.set('step', this.model.get('step') + 1);
    }
  },

  _onClickNext: function () {
    this._next();
  },

  _onChangeStep: function () {
    var self = this;
    this.$el.removeClass('is-step' + this.model.previous('step'), function () {
      self.$el.addClass('is-step' + self.model.get('step'));
    });

    this.$('.js-step').removeClass('is-step' + this.model.previous('step'), function () {
      self.$('.js-step').addClass('is-step' + self.model.get('step'));
    });
  },

  _close: function () {
    this._checkForgetStatus();
    this.trigger('close', this);
  },

  _onKeyDown: function (e) {
    e.stopPropagation();

    if (e.which === LEFT_KEY_CODE) {
      this._prev();
    } else if (e.which === RIGHT_KEY_CODE) {
      this._next();
    }
  },

  _checkForgetStatus: function () {
    if (this.$('.js-forget:checked').val()) {
      this._forget();
    }
  },

  _forget: function () {
    this._onboardingNotification.setKey(BUILDER_KEY, true);
    this._onboardingNotification.save();
  },

  clean: function () {
    $(document).off('keydown', this._keyDown);
    CoreView.prototype.clean.apply(this);
  }
});
