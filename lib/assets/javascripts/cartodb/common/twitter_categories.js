
  /**
   *  Twitter category list view
   *  - It will generate a collection to store all the 
   *    terms added.
   */

  cdb.common.TwitterCategories = cdb.core.View.extend({

    _MAX_CATEGORIES: 4,

    initialize: function() {
      // Add a first empty model
      var m = this._generateCategory();
      this.collection = new cdb.common.TwitterCategories.Collection([ m ]);

      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.collection.each(this._addCategory, this);
      return this;
    },

    _initBinds: function() {
      this.collection.bind('change', this._manageCategories, this);
    },

    _manageCategories: function() {
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
        this._setCategoriesIndex()
        return false;
      }

      // // Else, if there is any without anything, remove it (unless it is the first
      // // one or the last one), and generate new one
      // var empties = this.collection.filter(function(m) { return m.get('terms').length === 0 && !m.get('category') });
      // var first_empty = _.first(empties);
      
      // // Check if there is any category incompleted but any empty -> remove it!
      // if (first_empty && nonFilled.length > empties.length && collection_size > 1) {
      //   var v = _.find(this._subviews, function(view){ return first_empty.cid === view.model.cid });
      //   this._removeCategory(v);
      //   return false;
      // }

      // // Get first non-filled one
      // if (first_empty) {
      //   var v = _.find(this._subviews, function(view){ return first_empty.cid === view.model.cid });
      //   var pos = v.$el.index();

      //   // If there is only one category, do nothing
      //   if (collection_size === 1) return false;

      //   // If it is the last category, do nothing
      //   if (pos === (collection_size - 1)) return false;

      //   // If it is the first one, remove it
      //   if (pos === 0) {
      //     this._removeCategory(v);
      //   }

      //   // If we remove one but there is no more no-filled, let's create a new one!
      //   if ((nonFilled.length - 1) === 0 && ( collection_size < this._MAX_CATEGORIES )) {
      //     var m = this._generateCategory();
      //     this.collection.add(m);
      //     this._addCategory(m);
      //   }
      // }
    },

    // Set correct categories index
    _setCategoriesIndex: function() {

    },

    _generateCategory: function() {
      return new cdb.common.TwitterCategories.Model({
        terms: [],
        category: 'Category ' + (this.collection ? ( this.collection.size() + 1 ) : 1 )
      });
    },

    _addCategory: function(m) {
      var category = new cdb.common.TwitterCategory({ model: m });
      this.$el.append(category.render().el);
      this.addView(category);
    },

    _removeCategory: function(v) {
      v.hide();

      setTimeout(function() {
        v.clean();
        v.model.destroy();
      }, 400);
    }

  });



  /**
   *  Twitter category item view
   *  - It just needs a twitter category model
   */

  cdb.common.TwitterCategory = cdb.core.View.extend({

    className: 'twitter-category',

    _MAX_CATEGORIES: 4,

    _TEMPLATE: '<i class="twitter-icon"></i> \
                <input type="text" class="long terms text" value="<%= terms.join(",") %>" placeholder="' + _t('Insert your terms separated by commas') + '"/> \
                <input type="text" class="short category text" value="<%= category %>" placeholder="' + _t('Assign a category') + '" readonly tabindex="-1" />',

    events: {
      'keyup input.text': '_onInputChange'
    },

    initialize: function() {
      _.bindAll(this, '_onInputChange');
    },

    render: function() {
      this.$el.append(
        _.template(this._TEMPLATE)({
          terms: this.model.get('terms'),
          category: this.model.get('category')
        })
      );
      this.show();
      return this;
    },

    _onInputChange: function(e) {
      var $input = $(e.target);
      var type = $input.hasClass('terms') ? 'terms' : 'category';
      var value = $input.val();
      var d = {};

      // Get valid terms array
      if (type === "terms") {
        if (!value) {
          value = [];
        } else {
          value = value.split(',');
        }
      }

      d[type] = value;

      this.model.set(d);
    },

    show: function() {
      this.$el.addClass('enabled');
    },

    hide: function() {
      this.$el.removeClass('enabled');
    }

  });


  
  // Twitter categories collection
  cdb.common.TwitterCategories.Collection = Backbone.Collection.extend({
    model: cdb.common.TwitterCategories.Model
  });


  // Twitter categories model
  cdb.common.TwitterCategories.Model = cdb.core.Model.extend({
    defaults: {
      terms:    [],
      category: ''
    }
  });