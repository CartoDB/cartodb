
  /**
   *  Tags collection
   *
   */

  cdb.admin.CommonData.TagsCollection = Backbone.Collection.extend({

    initialize: function() {
      this.bind('change:selected', this._onTagSelected, this);
    },

    // Remove selection for the rest of the tags
    // _onTagSelected: function(m) {
    //   this.each(function(mdl){
    //     if (m !== mdl) {
    //       mdl.set('selected', false, { silent: true });
    //     }
    //   });
    // }

  })