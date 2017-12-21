var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Backbone = require('backbone-cdb-v3');


/**
 *  Categories view.
 *
 *  Select a category of the data library
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.router = this.options.router;
    this.localStorage = this.options.localStorage;
    // TODO: Get categories using an API.
    this.collection = new Backbone.Collection(); 
    this.template = cdb.templates.getTemplate('dashboard/views/categories');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var currentCategory = this.router.model.get('category');
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
    this.router.model.bind('change:category', this.render, this);
    this.add_related_model(this.router.model);
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