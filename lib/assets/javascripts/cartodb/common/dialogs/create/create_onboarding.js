'use strict';
var $ = require('jquery');
var _ = require('underscore');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');

/**
 *  Onboarding view for create dialog
 *
 */


module.exports = cdb.core.View.extend({

  tagName: 'div',
  className: 'OnBoarding',

  events: {
    'click': 'hide'
  },

  initialize: function() {
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('common/views/create/create_onboarding');
  },

  render: function() {
    this.$el.append(
      this.template({
        map: this.model.isMapType()
      })
    );

    return this;
  },

  _setLocalStorage: function() {
    if (this.model.isMapType()) {
      this.localStorage.set({ "onboarding-create-map": true });
    } else {
      this.localStorage.set({ "onboarding-create-dataset": true });
    }
  },

  show: function(timeout) {
    this.$el.show();
  },

  hide: function() {
    this.$el.hide();
    this._setLocalStorage();
  }

});
