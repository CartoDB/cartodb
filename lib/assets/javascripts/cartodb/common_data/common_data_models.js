

  
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

    set: function(attributes, options) {
      if (attributes.datasets !== undefined && !(attributes.datasets instanceof cdb.admin.CommonData.DatasetsCollection)) {
        attributes.datasets = new cdb.admin.CommonData.DatasetsCollection(attributes.datasets);
      }

      if (attributes.categories !== undefined && !(attributes.categories instanceof cdb.admin.CommonData.CategoriesCollection)) {
        
        // Add index category
        attributes.categories.unshift({ name: '', count:1111, image_url:'' });

        attributes.categories = new cdb.admin.CommonData.CategoriesCollection(attributes.categories);
      }

      return Backbone.Model.prototype.set.call(this, attributes, options);
    }

  });