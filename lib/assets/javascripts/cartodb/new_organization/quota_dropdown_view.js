var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');

/**
 *  Dropdown for setting user quota within organization
 *  
 *             ______/\____
 *            |            |
 *            |    quota   |
 *            |____________|
 */

module.exports = cdb.admin.DropdownMenu.extend({

  initialize: function() {
    this.elder('initialize');
    this.template_base = cdb.templates.getTemplate('new_organization/views/quota_dropdown');
    this._initBinds();
  },

  render: function() {
    var userName = this.model.get('userName');
    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));

    this.$el.html(
      this.template_base({
        userName: userName,
        userQuotaPer: Math.ceil(userQuotaPer)
      })
    );

    this._initViews();

    cdb.god.bind('closeDialogs', this.hide, this);
    $('body').append(this.el);

    return this;
  },

  _initBinds: function() {
    _.bindAll(this, '_onSlideChange');
    this.model.bind('change:userQuota', this._onQuotaChange, this);
  },

  _initViews: function() {
    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));

    // Init slider
    this.$(".js-slider").slider({
      max: 100,
      min: 1,
      step: 1,
      value: Math.ceil(userQuotaPer),
      range: 'min',
      orientation: "horizontal",
      slide: this._onSlideChange,
      change: this._onSlideChange
    });
  },

  _onSlideChange: function(ev, ui) {
    var userQuota = (this.model.get('orgQuota') - this.model.get('orgUsedQuota')) * ( ui.value / 100 );
    this.model.set('userQuota', userQuota);
  },

  _onQuotaChange: function() {
    // Change literal
    var userQuotaPer = (this.model.get('userQuota') * 100) / (this.model.get('orgQuota') - this.model.get('orgUsedQuota'));
    this.$('.js-userQuota').text(Math.ceil(userQuotaPer) + '%');
  },

  clean: function() {
    $(this.options.target).unbind('click', this._handleClick);
    this.constructor.__super__.clean.apply(this);
  }

});
