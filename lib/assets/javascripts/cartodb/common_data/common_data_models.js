

  
  /**
   *  Common data datasets collection
   *  
   *  - It will get all common data tables from the desired/specified
   *  account using common_data endpoint.
   *
   */
  
  cdb.admin.CommonData.DatasetsCollection = Backbone.Collection.extend({

    comparator: function(table) {
      return -new Date(table.get("created_at"));
    }

  });


  /**
   *  Common data categories model and collection
   *  
   *  - It will get all categories from common tables.
   *
   */

  cdb.admin.CommonData.CategoryModel = cdb.core.Model.extend({
    
    defaults: {
      name:       '',
      image_url:  '',
      selected:   false,
      count:      0
    }

  });
  
  cdb.admin.CommonData.CategoriesCollection = Backbone.Collection.extend({

    model: cdb.admin.CommonData.CategoryModel,

    parse: function(r) {
      return r
    },

    comparator: function(category) {
      return -category.get("count")
    }

  });


  /**
   *  Common data model
   *  
   *  - Storing categories and datasets :).
   *
   */
  
  cdb.admin.CommonData.Model = cdb.core.Model.extend({

    url: '/api/v1/common_data',

    initialize: function(attrs, opts) {
      this.router = opts.router;
      this._initBinds();
    },

    _initBinds: function() {
      this.router.model.bind('change', this._setSelectedCategory, this);
      this.bind('change:datasets', this._setSelectedCategory, this);
    },

    _setSelectedCategory: function() {
      var self = this;
      var tag = self.router.model.get('tag');
      var latest = self.router.model.get('latest');

      // Set selected state for tags collection
      this.get('categories') && this.get('categories').each(function(c) {
        if (c.get('name') === self.router.model.get('tag') && !latest) {
          c.set('selected', true)
        } else {
          c.set('selected', false)
        }
      });
    },

    set: function(attributes, options) {
      if (attributes.datasets !== undefined && !(attributes.datasets instanceof cdb.admin.CommonData.DatasetsCollection)) {
        attributes.datasets = new cdb.admin.CommonData.DatasetsCollection(attributes.datasets);
      }

      if (attributes.categories !== undefined && !(attributes.categories instanceof cdb.admin.CommonData.CategoriesCollection)) {
        
        // Added index category in the top
        attributes.categories.unshift({
          name:       '',
          count:      1111, // To put it first on the list
          image_url:  '',
          selected:   false
        });

        attributes.categories = new cdb.admin.CommonData.CategoriesCollection(attributes.categories);
      }

      return Backbone.Model.prototype.set.call(this, attributes, options);
    }

  });