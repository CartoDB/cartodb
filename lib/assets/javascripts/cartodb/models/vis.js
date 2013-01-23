
cdb.admin.Visualization = cdb.core.Model.extend({

  initialize: function() {
    this.map = new cdb.admin.Map();

    /*this.bind('change:map_id', function() {
      this.map
        .set('id', this.get('map_id'))
        .fetch();
    }, this);
    */

  },


});
