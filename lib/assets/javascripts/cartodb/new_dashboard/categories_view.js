var $ = require('jquery');
var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var Backbone = require('backbone');


/**
 *  Categories view.
 *
 *  Select a category of the data library
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.localStorage = this.options.localStorage;
    // TODO: Get categories using an API.
    this.collection = new Backbone.Collection(); 
    this.template = cdb.templates.getTemplate('new_dashboard/views/categories');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var currentCategory = this.localStorage.get('dashboard.category');
    var categories =  this.collection.models;
    
    this.$el.html(
      this.template({
        currentCategory:  currentCategory,
        categories:       categories
      })
    );

    this._initViews();

    return this;
  },

  _initBinds: function() {

  },

  _initViews: function() {
    // Tipsys?
    var self = this;
    this.$('.Categories-option[data-title]').each(function(i,el){
      self.addView(
        new cdb.common.TipsyTooltip({
          el: $(el),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    });
  },

});