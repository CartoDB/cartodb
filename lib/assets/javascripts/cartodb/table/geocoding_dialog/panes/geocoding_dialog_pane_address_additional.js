
  /**
   *  View for "managing" additional columns
   *  within geocoding address pane.
   *
   *  - It needs the additional columns collection
   *    already created in the parent.
   *
   */

  cdb.admin.GeocodingDialog.Pane.Address.Additional = cdb.core.View.extend({

    _MAX_ADDITIONAL_COLUMNS: 2,

    events: {
      'click a.add_column': '_onAddColumnClick'
    },

    initialize: function() {
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      this.collection.each(this._addItem, this);
      this._initViews();
      this._checkLink();
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onAddColumnClick');
      this.collection.bind('add',     this._addItem, this);
      this.collection.bind('remove',  this._removeItem, this);
      this.collection.bind('reset',   this.render, this);
      this.collection.bind('add remove reset change',  this._checkLink, this);
      this.add_related_model(this.collection);

      this.model.bind('change', this._checkLink, this);
    },

    _initViews: function() {
      // Add column tooltip
      var tooltip = new cdb.common.TipsyTooltip({
        el: this.$('.add_column')
      });
      this.addView(tooltip);
    },

    _addItem: function(m) {
      var a = new cdb.admin.GeocodingDialog.Pane.Address.Additional.Item({
        model:        m,
        columns_list: this.options.columns_list
      });
      this.$el.append(a.render().el);
      this.addView(a);
    },

    _removeItem: function(m) {},

    _checkLink: function() {
      var linkVisible = this.collection.size() < this._MAX_ADDITIONAL_COLUMNS;
      var nonValueModels = this.collection.where({ columnValue: '' }).length;
      var addressValue = this.model.getValue();

      this.$('.add_column')
        [ linkVisible ? 'show' : 'hide' ]()
        [ nonValueModels === 0 && addressValue !== "" ? 'removeClass' : 'addClass' ]('disabled')
    },

    _onAddColumnClick: function(e) {
      if (e) this.killEvent(e);

      var active = this.collection.size() < this._MAX_ADDITIONAL_COLUMNS;
      var nonValueModels = this.collection.where({ columnValue: '' }).length;
      var addressValue = this.model.getValue();

      
      if (active && nonValueModels === 0 && addressValue !== "") {
        this.collection.add({ columnValue: ''});
      }
    }

  })
  
