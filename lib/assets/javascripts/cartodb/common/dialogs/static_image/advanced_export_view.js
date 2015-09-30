var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var moment = require('moment');

module.exports = BaseDialog.extend({

  _FORMAT: 'png',

  events: BaseDialog.extendEvents({
    'click .js-format': '_onClickFormat',
    'focus .js-textInput': '_onFocus',
    'blur .js-textInput': '_onBlur'
  }),

  initialize: function() {
    this.elder('initialize');

    this.options = _.defaults(this.options, { format: this._FORMAT });
    this.model = new cdb.core.Model(this.options);
    this._initBinds();
  },

  render_content: function() {
    return this.getTemplate('common/dialogs/static_image/advanced_export_view')(this.model.attributes);
  },

  _initBinds: function() {
    this.model.on('change:format', this._onChangeFormat, this);
  },

  _onFocus: function(e) {
    $(e.target).parent().addClass('is-focused');
  },

  _onBlur: function(e) {
    $(e.target).parent().removeClass('is-focused');
  },

  _onChangeFormat: function() {
    this.$('.js-radioButton').removeClass('is-checked');
    this.$('.js-' + this.model.get('format')).addClass('is-checked');
  },

  _onClickFormat: function(e) {
    this.killEvent(e);
    var $el = $(e.target).closest('.js-format');
    this.model.set('format', $el.data('format'));
  },

  _ok: function() {
    var width = +this.$('.js-width').val();
    var height = +this.$('.js-height').val();
    var format = this.model.get('format');

    this.trigger('generate_image', { width: width, height: height, format: format });
    this.close();
  }
});
