var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var TwitterCategoriesCollection = require('./twitter_categories_collection');
var TwitterCategoriesModel = require('./twitter_category_model');
var TwitterCategoryView = require('./twitter_category_view');

/**
 *  Twitter category list view
 *  - It will generate a collection to store all the 
 *    terms added.
 */

module.exports = cdb.core.View.extend({

  _MAX_CATEGORIES: 4,
  _MAX_TERMS: 29,

  initialize: function() {
    this._disabled = (this.options && this.options.disabled) ? this.options.disabled : false;
    
    // Add a first empty model
    var m = this._generateCategory();
    this.collection = new TwitterCategoriesCollection([ m ]);

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.collection.each(this._addCategory, this);
    return this;
  },

  _initBinds: function() {
    this.collection.bind('change', this._manageCategories, this);
    this.collection.bind('change', this._onCategoryChange, this);
    this.add_related_model(this.collection);
  },

  _manageCategories: function() {
    var self = this;
    var collection_size = this.collection.size();

    // Check if already created models are completed
    var nonFilled = this.collection.filter(function(m) {
      return m.get('terms').length === 0
    });

    // if so, generate new one
    if (nonFilled.length === 0 && collection_size < this._MAX_CATEGORIES) {
      var m = this._generateCategory();
      this.collection.add(m);
      this._addCategory(m);
      return false;
    }

    // else, let's check
    if (nonFilled.length > 0) {
      var m = _.first(nonFilled);
      var v = _.find(this._subviews, function(view){ return m.cid === view.model.cid });
      var pos = v.$el.index();
      
      // Only one item in the collection, do nothing
      if (collection_size === 1) return false;

      // If it is the last item but there is no more items, do nothing
      if (pos === (collection_size - 1)) return false;

      // If it is not the last item and there is another non-filled element
      // let's remove that one.
      if (pos !== (collection_size - 1) && nonFilled.length > 1) {
        m = nonFilled[1];
        v = _.find(this._subviews, function(view){ return m.cid === view.model.cid });
        this._removeCategory(v);
      }

      // Reorder category indexes :(
      this._setCategoryIndex();
    }
  },

  // Set proper index after any category removed
  _setCategoryIndex: function() {
    var self = this;

    // Hack to set properly category numbers
    this.$('.twitter-category').each(function(i,el) {
      // Get category, removing Category word
      var category = $(el).find('.js-category').text().replace('Category ','');

      if (category !== (i+1) ) {
        // Find model
        var m = self.collection.find(function(m) { return m.get('category') === category });
        // Find view
        m.set('category', (i+1).toString() );  
      }
      
    })
  },

  _generateCategory: function() {
    return new TwitterCategoriesModel({
      disabled: this._disabled,
      terms: [],
      category: (this.collection ? ( this.collection.size() + 1 ) : 1 ).toString()
    });
  },

  _addCategory: function(m) {
    var category = new TwitterCategoryView({ model: m });
    
    category.bind('submit', this._onCategorySubmit, this);
    category.bind('limit', this._onCategoryLimit, this);
    category.bind('nolimit', this._onCategoryNoLimit, this);

    this.$el.append(category.render().el);
    
    this.addView(category);
    this.trigger("addCategory");
  },

  _removeCategory: function(v) {
    v.hide();
    v.clean();
    v.model.destroy();
    this.trigger("removeCategory");
  },

  _onCategorySubmit: function() {
    this.trigger('submitCategory', this.collection.toJSON(), this);
  },

  _onCategoryLimit: function() {
    this.trigger('limitCategory', this.collection.toJSON(), this);
  },

  _onCategoryNoLimit: function() {
    this.trigger('noLimitCategory', this.collection.toJSON(), this);
  },

  _onCategoryChange: function() {
    this.trigger('changeCategory', this.collection.toJSON(), this);
  },

  getCategories: function() {
    return this.collection.toJSON();
  }

});