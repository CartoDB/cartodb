var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var Backbone = require('backbone-cdb-v3');
var CategoryTree = require('../table/category_tree');


/**
 *  Categories view.
 *
 *  Select a category of the data library
 *
 */

module.exports = cdb.core.View.extend({

  _categoryTree: undefined,
  _DATASETS_CATEGORY: 1,
  _MAPS_CATEGORY: 2,

  initialize: function() {
    this.router = this.options.router;
    this.localStorage = this.options.localStorage;
    // TODO: Get categories using an API.
    this.collection = new Backbone.Collection(); 
    this.template = cdb.templates.getTemplate('dashboard/views/side_menu');

    this._initBinds();
  },

  render: function() {

    this.clearSubViews();

    var currentCategory = this.router.model.get('category');
    var categories =  this.collection.models;

    this._initViews();

    return this;
  },

  _initBinds: function() {
    var self = this;
    this.router.model.bind('change:content_type', function() {
      var isMaps = self.router.model.get('content_type') == "maps";
      var rootId = isMaps ? self._MAPS_CATEGORY : self._DATASETS_CATEGORY;
      self._categoryTree = new cdb.admin.CategoryTree({user: self.options.user, rootId: rootId});
      self._categoryTree.load(self, self._initCategoryTree);
    }, this);
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

  _initCategoryTree: function() {
    var self = this;
    var isMaps = this.router.model.get('content_type') == "maps";
    this.collection.reset();
    var rootId = isMaps ? self._MAPS_CATEGORY : self._DATASETS_CATEGORY;
    var categories = this._categoryTree.getChildCategories(rootId);
    var category, id, numCategories = categories.length;
    for (i = 0; i < numCategories; ++i) {
      category = categories[i];
      this.collection.add(category);
    }
    this.$el.html(
      this.template({
        router: this.router,
        content_type: isMaps ? "maps" : "datasets",
        current_category: this.router.model.get('page'),
        categories: this.collection.models
      })
    );

    var leftMenuContent = this.$el.find(".LeftMenuContent");

    leftMenuContent.find(".MenuItem").click(function(){
      leftMenuContent.find(".MenuItem").removeClass("selected");
      $(this).addClass("selected");
      var contentType = isMaps ? "maps" : "datasets"
      var categoryId = $(this).data("category");
      var params = $(this).data("params");

      self.router.model.set('q', '', { silent: true });
      
      var order = $(this).data("order");

      if (order) {
        self.localStorage.set({ 'dashboard.order': order });
        self.router.model.set('order', order, { silent: true });
      }

      if (categoryId) {
        self.router.navigate(contentType + "/category/" + categoryId, {trigger: true});
      } else if (params !== undefined) {
        self.router.navigate(contentType + params, {trigger: true});
      }
    });

    this.$el.find(".ParentChevron").click(function(ev){
      $(this).closest('.MenuItem').toggleClass("expanded");
      $(this).closest('li').find("ul.SubCategories").toggleClass("expanded");
      ev.stopPropagation();
    });
  }

});