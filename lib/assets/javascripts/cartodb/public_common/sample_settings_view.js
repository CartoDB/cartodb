var cdb = require('cartodb.js-v3');
var SettingsDropdown = require('./user_settings/dropdown_view');
var $ = require('jquery-cdb-v3');
var CreateMapModel = require('../common/dialogs/create/create_map_model');

/**
 * View to render the user settings section in the header.
 * Expected to be created from existing DOM element.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-dropdown-target': '_createDropdown',
    'click .js-save-map': '_saveMap'
  },

  render: function() {
    var dashboardUrl = this.model.viewUrl().dashboard();
    var datasetsUrl = dashboardUrl.datasets();
    var mapsUrl = dashboardUrl.maps();

    this.$el.html(
      cdb.templates.getTemplate('public_common/sample_settings_template')({
        avatarUrl: this.model.get('avatar_url'),
        mapsUrl: mapsUrl,
        datasetsUrl: datasetsUrl,
        vis_name: window.vis_name,
        dashboard_url: dashboardUrl.toString()
      })
    );

    return this;
  },

   _saveMap: function() {
        var collection = new cdb.admin.Visualizations();
        var layers = [];
        var datasets = window.datalib_layers;

        collection.options.set({
          q: '',
          tags: '',
          shared: false,
          locked: false,
          only_liked: false,
          samples: false,
          order: 'updated_at',
          types: 'table,remote',
          type: '',
          deepInsights: false
        });

        collection.bind('loaded', function datasetsLoadedCallback() {
          collection.unbind('loaded', datasetsLoadedCallback);
          for(var i=0; i<datasets.length; ++i)
          {
            var ds = collection.where({ name: datasets[i] });
            layers.push(ds[0]);
          }

          cdb.god.trigger(
            'openCreateDialog',
            {
              type: 'map',
              listing: 'import',
              selectedItems: layers
            }
          ); 

        } );

        collection.bind('loadFailed', function datasetsLoadFailedCallback() {
          collection.unbind('loadFailed', datasetsLoadFailedCallback);
          //window.dashboard.collection.trigger("error");
        });
        //window.dashboard.collection.trigger("show-loader");
        collection.fetch();


  },

  _createDropdown: function(ev) {
    this.killEvent(ev);
    cdb.god.trigger('closeDialogs');

    var view = new SettingsDropdown({
      target: $(ev.target),
      model: this.model, // user
      horizontal_offset: 18
    });
    view.render();

    view.on('onDropdownHidden', function() {
      view.clean();
    }, this);

    view.open();
  }

});
