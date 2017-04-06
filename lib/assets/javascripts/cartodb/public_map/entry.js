var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var UserSettingsView = require('../public_common/user_settings_view');
var UserTourView = require('../public_common/user_tour_view');
var UserIndustriesView = require('../public_common/user_industries_view');
var UserResourcesView = require('../public_common/user_resources_view');
var UserDiscoverView = require('../public_common/user_discover_view');
var PublicMapWindow = require('./public_map_window');
var MapCardPreview = require('../common/views/mapcard_preview');
var LikeView = require('../common/views/likes/view');
var UserShareView = require('../public_common/user_share_view');
var UserMetaView = require('../public_common/user_meta_view');

$(function() {


  // No attributions and no links in this map (at least from cartodb)
  cartodb.config.set({
    cartodb_attributions: "",
    cartodb_logo_link: ""
  });

  $.extend( $.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
    }
  });

  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(window.config);
    cdb.config.set('url_prefix', (window.bSampleView === undefined || window.bSampleView === false) ? window.base_url : user_data.base_url);

    var currentUser = new cdb.admin.User(window.user_data);
    var viz_descriptionTag = window.vizdata.description;

    cdb.god.bind('openCreateDialog', function(d) {
      var CreateDialog = require('../common/dialogs/create/create_view');
      var CreateMapModel = require('../common/dialogs/create/create_map_model');

      var createModel;
      d = d || {};
      if (d.type === 'dataset') {
        createModel = new CreateDatasetModel({}, {
          user: currentUser
        });
      } else {
        var options = {};
        if (d.listing !== undefined) {
          options.listing = d.listing;
        }

        var xmlParser = new DOMParser();
        xmlDoc = xmlParser.parseFromString(viz_descriptionTag, "text/xml");
        var viz_description = "";
        if (xmlDoc.getElementsByTagName("p").length > 0) {
          viz_description = xmlDoc.getElementsByTagName("p")[0].childNodes[0].nodeValue;
        }

        createModel = new CreateMapModel(
          options, _.extend({user: currentUser,
                             mapName: window.vis_name,
                             description: viz_description
                              },d) );
      }

      var createDialog = new CreateDialog({
        model: createModel,
        user: currentUser,
        clean_on_hide: true
      });

      createModel.bind('startTutorial', function() {
        createDialog.close();

        var dlg = new VideoTutorialView({
          clean_on_hide: true,
          enter_to_confirm: false
        })
        cdb.god.trigger("onTemplateSelected", this);
        dlg.appendToBody();
      });

      createModel.bind('datasetCreated', function(tableMetadata) {
        if (router.model.isDatasets()) {
          var vis = new cdb.admin.Visualization({ type: 'table' });
          vis.permission.owner = currentUser;
          vis.set('table', tableMetadata.toJSON());
          window.location = vis.viewUrl(currentUser).edit();
        } else {
          var vis = new cdb.admin.Visualization({ name: DEFAULT_VIS_NAME });
          vis.save({
            tables: [ tableMetadata.get('id') ]
          },{
            success: function(m) {
              window.location = vis.viewUrl(currentUser).edit();
            },
            error: function(e) {
              createDialog.close();
              collection.trigger('error');
            }
          });
        }
      }, this);

      createDialog.appendToBody();
      createModel.viewsReady();
    });

    
    var userTourView = new UserTourView({
      el: $('.js-user-tour'),
    });

    var userIndustriesView = new UserIndustriesView({
      el: $('.js-user-industries'),
    });

    var userResourcesView = new UserResourcesView({
      el: $('.js-user-resources'),
    });

    var userDiscoverView = new UserDiscoverView({
      el: $('.js-user-discover'),
    });

    var userShareView = new UserShareView({
      el: $('.js-Navmenu-share'),
      model: new cdb.core.Model({
        active: false
      })
    });

    var userMetaView = new UserMetaView({
      el: $('.js-user-meta'),
      model: new cdb.core.Model({
        active: false
      })
    });

    $(document.body).bind('click', function() {
      cdb.god.trigger('closeDialogs');
      userShareView.close();
    });

    var authenticatedUser = new cdb.open.AuthenticatedUser();
    authenticatedUser.bind('change', function() {
      if (authenticatedUser.get('username')) {
        var user = new cdb.admin.User(authenticatedUser.attributes);

        var userSettingsView;

        if (window.bSampleView === undefined || window.bSampleView === false) {
            userSettingsView = new UserSettingsView({
            el: $('.js-user-settings'),
            model: user,
            vizName: vis_name
           });
        }
        else {
          var SampleSetingsView = require('../public_common/sample_settings_view');
          userSettingsView = new SampleSetingsView({
            el: $('.js-user-settings'),
            model: user,
            vizName: vis_name
           });
        }

        userSettingsView.render();

        if (user.get('username') === window.owner_username) {
          // Show "Edit in CartoDB" button if logged user
          // is the map owner ;)
          $('.js-Navmenu-editLink').addClass('is-active');
        }
      }
    });

  

    // Vis likes
    $('.js-likes').each(function() {
      var likeModel = cdb.admin.Like.newByVisData({
        likeable: false,
        vis_id: $(this).data('vis-id'),
        likes: $(this).data('likes-count'),
        size: $(this).data('likes-size')
      });
      authenticatedUser.bind('change', function() {
        if (authenticatedUser.get('username')) {
          likeModel.bind('loadModelCompleted', function() {
            likeModel.set('likeable', true);
          });
          likeModel.fetch();
        }
      });
      var likeView = new LikeView({
        el: this,
        model: likeModel
      });
      likeView.render();
    });

    // More user vis cards
    $('.MapCard').each(function() {
      var visId = $(this).data('visId');
      if (visId) {
        var username = $(this).data('visOwnerName');
        var mapCardPreview = new MapCardPreview({
          el: $(this).find('.js-header'),
          visId: $(this).data('visId'),
          username: username,
          mapsApiResource: cdb.config.getMapsResourceName(username)
        });
        mapCardPreview.load();
      }
    });

    

    // Check if device is a mobile
    var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Window view
    var public_window = new PublicMapWindow({
      el:                   window,
      user_name:            user_name,
      owner_username:       owner_username,
      vis_id:               vis_id,
      vis_name:             vis_name,
      vizdata:              vizdata,
      config:               config,
      map_options:          map_options,
      isMobileDevice:       mobileDevice,
      belong_organization:  belong_organization
    });

    authenticatedUser.fetch();

    
  });
});
