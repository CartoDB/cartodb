
  /*
   *  Assets list (depends on a collection)
   *  - Manage thanks to a collection.
   *  - Each item needs a model with 'id', 'public_url' and 'state'
   *  if it is neccessary.
   *  - Also it needs to know the id of the user.
   *
   *  new cdb.admin.AssetsList({
   *    collection: assets_collection
   *  },{
   *    user: user_data
   *  })  
   */

  cdb.admin.AssetsList = cdb.core.View.extend({

    tagName: 'ul',

    className: 'assets-list',

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      var self = this;

      // clean old views
      this.clearSubViews();

      // render new items
      this.collection.each(function(mdl) {
        var item = new cdb.admin.AssetsItem({
          model: mdl
        });
        item.bind('selected', self._unselectItems, self);

        self.$el.append(item.render().el);
        self.addView(item);
      });

      return this;
    },

    // Unselect all images expect the new one 
    _unselectItems: function(m) {
      this.collection.each(function(mdl) {
        if (mdl != m && mdl.get('state') == 'selected') {
          mdl.set('state', 'idle');
        }
      });
    }
  });