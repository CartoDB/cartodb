var $ = require('jquery-cdb-v3');
var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var PublicMapInfoView = require('../../../../javascripts/cartodb/public_map/public_map_info_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var visualizationsJson = require('../../visualizations_sample.json');
var moment = require('moment');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var DATA = userdataJson;
var VIZDATA = vizdataJson;
var VISUALIZATIONS = visualizationsJson;

describe('public_map/public_map_info_static', function () {
  it('should render', function () {
    var daysAgo = moment(vizdataJson.updated_at).fromNow();

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.el).toBeDefined();
    expect(this.view.template).toBeDefined();
    expect(this.view.$('.PublicMap-title').text().trim()).toEqual(VIZDATA.name);
    expect(this.view.$('.PublicMap-description').text().trim()).toEqual(VIZDATA.description);

    expect($(this.view.$('.PublicMap-metaItem')[0]).text().trim()).toEqual('public_map.info.updated ' + daysAgo);
    expect($(this.view.$('.PublicMap-metaItem')[1]).text().trim()).toEqual('public_map.info.views_pluralize');
    expect(this.view.$('.Navmenu-editLink Navmenu-editLink--more js-Navmenu-editLink--more').length).toBeDefined();
  });

  it('should have no tags', function () {
    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.PublicMap-metaLink').length).toBe(0);
  });

  it('should have three visible tags', function () {
    var vizdataWithTags = _.extend(VIZDATA, {
      tags: ['tag1', 'tag2']
    });

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: vizdataWithTags,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.PublicMap-metaLink').length).toBe(2);
  });

  it('should have three visible tags and "more" information', function () {
    var vizdataWithTags = _.extend(VIZDATA, {
      tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
    })

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.PublicMap-metaLink').length).toBe(3);
    expect($(this.view.$('.PublicMap-metaItem')[2]).text().split(/[\s|\n]/).join('')).toEqual('tag1,tag2,tag3and2public_map.info.more');
  });

  it('should have a disqus view if disqus shortname is provided', function () {
    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.js-disqus').length).toBe(1);
  });

  it('should have "more from user" if the user has more derived maps', function () {
    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.MapsList.PublicMap-mapsList').length).toBe(1);
    expect(this.view.$('.MapsList-item').length).toBe(1);
    expect(this.view.$('.PublicMap-secondaryTitle')[0].innerHTML).toEqual('public_map.datasets.title');
    expect(this.view.$('.PublicMap-secondaryTitle')[1].innerHTML).toEqual('public_map.info.more_from User Name');
  });

  it('should not include the current map as a derived map', function () {
    VISUALIZATIONS.push(VIZDATA);

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: VISUALIZATIONS
    });

    this.view.render();

    expect(this.view.$('.MapsList-item').length).toBe(1);
  });

  it('should show a maximum of three maps', function () {
    var visualization1 = _.clone(VISUALIZATIONS[0]);
    var visualization2 = _.clone(VISUALIZATIONS[0]);
    var visualization3 = _.clone(VISUALIZATIONS[0]);
    var visualization4 = _.clone(VISUALIZATIONS[0]);

    visualization1.id = 'id1';
    visualization2.id = 'id2';
    visualization3.id = 'id3';
    visualization4.id = 'id4';

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: [
        visualization1,
        visualization2,
        visualization3,
        visualization4
      ]
    });

    this.view.render();

    expect(this.view.$('.MapsList-item').length).toBe(3);
  });

  it('should only show pubic maps', function () {
    var visualization = _.clone(VISUALIZATIONS[0]);

    visualization.privacy = 'PRIVATE';

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      mapOwnerUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA,
      visualizations: [visualization]
    });

    this.view.render();

    expect(this.view.$('.MapsList-item').length).toBe(0);
  });

  afterEach(function () {
    this.view.clean();
    window.defaultFallbackBasemapTemplateUrl = undefined;
    delete window.defaultFallbackBasemapTemplateUrl;
  });
});
