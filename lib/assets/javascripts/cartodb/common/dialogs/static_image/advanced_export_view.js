var cdb = require('cartodb.js');
var BaseDialog = require('../../views/base_dialog/view');
var ViewFactory = require('../../view_factory');
var randomQuote = require('../../view_helpers/random_quote');
var moment = require('moment');

module.exports = BaseDialog.extend({

  defaults: {
    format: "jpg"
  },

  events: BaseDialog.extendEvents({
    'click .js-format': '_onClickFormat'
  }),

  initialize: function() {
    this.elder('initialize');

    this._initViews();
    this._initModel();
    this._initBinds();
  },

  render_content: function() {
    return this.getTemplate('common/dialogs/static_image/advanced_export_view')({
      width: this.options.width,
      height: this.options.height
    });
  },

  _initViews: function() {
    this.vis = this.options.vis;
    this.user = this.options.user;
  },

  _initModel: function() {
    this.model = new cdb.core.Model({
      width: this.options.width,
      height: this.options.height,
      format: this.defaults.format
    });
  },

  _initBinds: function() {
    this.model.on('change:format', this._onChangeFormat, this);
  },

  _onChangeFormat: function() {
    this.$(".js-format > button").removeClass('is-checked');
    this.$(".js-" + this.model.get('format')).addClass('is-checked');
  },

  _onClickFormat: function(e) {
    this.killEvent(e);

    var $el = $(e.target).closest(".js-format");
    var format = $el.data('format');
    this.model.set('format', format);
  },

  _ok: function() {
    var width = +this.$(".js-width").val();
    var height = +this.$(".js-height").val();
    var format = this.model.get('format');

    this.trigger('generate_image', { width: width, height: height, format: format });
    this.close();
  }
});
