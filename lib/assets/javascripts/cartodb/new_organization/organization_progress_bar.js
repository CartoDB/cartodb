var $ = require('jquery');
var cdb = require('cartodb.js');
var Utils = require('cdb.Utils');
var QuotaDropdown = require('./quota_dropdown_view');

/**
 *  Progress quota bar for organization users
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-changeQuota': '_openDropdown'
  },

  initialize: function() {
    // values?
    if (this.options.quota_in_bytes === undefined || this.options.used_quota_in_bytes === undefined || this.options.userQuota === undefined) {
      throw new TypeError('Missing parameters for organization user progress bar');
    }
    this.$input = this.options.input;
    this.model = new cdb.core.Model({
      orgQuota: this.options.quota_in_bytes,
      orgUsedQuota: this.options.used_quota_in_bytes,
      userName: this.options.userName,
      userUsedQuota: this.options.userUsedQuota,
      userQuota: this.options.userQuota
    });
    
    this._initBinds();
  },

  render: function() {
    var userQuota = this.model.get('userQuota');
    var orgQuota = this.model.get('orgQuota');
    var assignedPer = (userQuota * 100) / orgQuota;

    // Edit assigned bar
    this.$('.js-assignedBar').css('width', assignedPer + '%' );

    // Edit assigned literal
    this.$('.js-assignedSize').text(Utils.readablizeBytes(userQuota));

    return this;
  },

  _initBinds: function() {
    this.model.bind('change:userQuota', this.render, this);
    this.model.bind('change:userQuota', this._onQuotaChange, this);
  },

  _onQuotaChange: function() {
    var quota = this.model.get('userQuota');
    if (quota) {
      this.$input.val(parseFloat(quota).toFixed(0));  
    }
  },

  _openDropdown: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('closeDialogs');

    var view = new QuotaDropdown({
      target: $(ev.target),
      model: this.model,
      vertical_position: 'up',
      horizontal_offset: -92,
      tick: 'center',
      width: 260
    });
    view.render();

    view.on('onDropdownHidden', function() {
      view.clean();
    }, this);

    view.open();
  }

})