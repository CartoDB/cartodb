
cdb.admin.Visualization = cdb.core.Model.extend({

  initialize: function() {
    this.map = new cdb.admin.Map();

    /*this.bind('change:map_id', function() {
      this.map
        .set('id', this.get('map_id'))
        .fetch();
    }, this);
    */

    // Fake attributes
    // God, forgive me
    /*
      - A name
      - A description
      - Some tags?
      - ID?
      - Last edition
      - Belonging tables
    */

    this.set({
      id:             69,
      description:    null,
      map_id:         96,
      name:           "untitled_vis_1",
      tags:           "jamon, probando, test",
      updated_at:     "2013-03-04T18:09:34+01:00",
      visualization:  true
    })

  }

});

/**
* visualizations available for given user
*
* usage:
*
* var visualizations = new cbd.admin.Visualizations()
* visualizations.fetch();
*
*/

cdb.admin.Visualizations = Backbone.Collection.extend({

  defaults: {
    api_url: '/api/v1/tables/'
  },

  model: cdb.admin.CartoDBTableMetadata, // TODO: replace this with the Vis model

  _ITEMS_PER_PAGE: 20,

  initialize: function() {
    this.options = new cdb.core.Model({
      tag_name  : "",
      q         : "",
      page      : 1,
      per_page  : this._ITEMS_PER_PAGE
    });

    this.total_entries = 0;

    this.options.bind("change", this._changeOptions, this);
    this.bind("reset",          this._checkPage,     this);
    this.bind("update",         this._checkPage,     this);
    this.bind("add",            this._fetchAgain,    this);
  },

  getTotalPages: function() {
    return Math.ceil(this.total_entries / this.options.get("per_page"));
  },

  _fetchAgain: function() {
    this.fetch();
  },

  _checkPage: function() {

    var total = this.getTotalPages();
    var page  = this.options.get('page') - 1;

    if (this.options.get("page") > total ) {
      this.options.set({"page": total + 1});
    } else if (this.options.get("page") < 1) {
      this.options.set({"page": 1});
    }

  },

  _createUrlOptions: function() {
    return _(this.options.attributes).map(function(v, k) { return k + "=" + encodeURIComponent(v); }).join('&');
  },

  url: function() {
    return this.defaults.api_url + "?" + this._createUrlOptions();
  },

  remove: function(options) {
    this.total_entries--;
    this.elder('remove', options);
  },

  parse: function(response) {
    this.total_entries = response.total_entries;
    return response.tables;
  },

  _changeOptions: function() {
    this.trigger('updating');

    var self = this;
    $.when(this.fetch()).done(function(){
      self.trigger('forceReload')
    });
  },

  create: function(m) {
    var dfd = $.Deferred();
    Backbone.Collection.prototype.create.call(this,
      m,
      {
        wait: true,
        success: function() {
          dfd.resolve();

        },
        error: function() {
          dfd.reject();
        }
      }
    );
    return dfd.promise();
  },

  fetch: function(opts) {
    var dfd = $.Deferred();
    var self = this;
    this.trigger("loading", this);
    $.when(Backbone.Collection.prototype.fetch.call(this,opts)).done(function(res) {
      self.trigger('loaded');
      dfd.resolve();
    }).fail(function(res) {
      self.trigger('loadFailed');
      dfd.reject(res);
    });
    return dfd.promise();
  },

  /**
  * Fetch the server for the collection, but not set it afterwards, only returns pases the
  * json throught a deferred object
  * @return {$.Deferred}
  */
  fetchButNotSet: function() {
    var dfd = $.Deferred();
    $.ajax({
      url: this.url(),
      dataType:'json',
      success:function(res){
        dfd.resolve(res);
      },
      error: function() {
        dfd.reject();
      }
    });

    return dfd.promise();
  },

  /**
  * If the number of lists is smaller than size parameter, fetch the list without setting it
  * and ad the last n elements to the collection.
  * This is needed to be able to add new elements to the collection without rewriting (AKA: lose the bindings)
  * the existant models (for example, if want to update the collection, but not re-render the view)
  * @param  {integer} size
  * @return {Promise}
  */
  refillVisualizationList: function(size) {
    var self = this;
    var dfd = $.Deferred();
    var currentSize = this.models.length;
    var elementToAdd = size - currentSize;

    $.when(this.fetchButNotSet()).done(function(res) {
      // we need to update the current size
      var currentSize = self.models.length;
      var limit = res.tables.length >= size ? res.tables.length : size;

      for (var i = 0; i < limit; i++) {
        if (!self.hasVisualization(res.tables[i].name)) {
          self.add(res.tables[i], {silent:true});
        }
      }

      dfd.resolve(true);

    });

    return dfd.promise();
  },

  hasVisualization: function(name) {

    for (var i in this.models)  {
      if (this.models[i].get('name') === name) {
        return true;
      }
    }

    return false;
  }
});

