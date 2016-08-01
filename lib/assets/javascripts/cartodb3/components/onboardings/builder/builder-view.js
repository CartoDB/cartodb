var cdb = require('cartodb.js');
var $ = require('jquery');
var LocalStorage = require('../../../components/local-storage/local-storage');
var CoreView = require('backbone/core-view');
var template = require('./builder-view.tpl');

var STORAGE_KEY = 'builder';
var LEFT_KEY_CODE = 37;
var RIGHT_KEY_CODE = 39;

module.exports = CoreView.extend({
  className: 'BuilderOnboarding step0 is-opening',

  events: {
    'click .js-forget': '_onClickForget',
    'click .js-start': '_onClickStart',
    'click .js-next': '_onClickNext',
    'click .js-close': '_close'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._modalModel = opts.modalModel;
    this._userModel = opts.userModel;
    this.model = new cdb.core.Model({
      step: 0
    });

    this.model.bind('change:step', this._onChangeStep, this);

    $(document).on('keydown', this._onKeyDown.bind(this));

    LocalStorage.init(STORAGE_KEY, {
      userModel: this._userModel
    });

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
  },

  _prev: function () {
    if (this.model.get('step') >= 1) {
      this.model.set('step', this.model.get('step') - 1);
    }
  },

  _next: function () {
    var self = this;

    if (this.model.get('step') <= 3) {
      if (this.model.get('step') === 0) {
        this.model.set('step', this.model.get('step') + 1);
      } else {
        this.model.set('step', this.model.get('step') + 1);
      }
    }
  },

  _onClickNext: function () {
    this._next();
  },

  _onClickStart: function () {
    this.model.set('step', 1);
  },

  _onChangeStep: function () {
    var self = this;
    this.$el.removeClass('step' + this.model.previous('step'), function () {
      self.$el.addClass('step' + self.model.get('step'));
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
    // LocalStorage.set(this._getGenericAnalysisType(), true);
  }
});
