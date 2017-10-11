var _ = require('underscore');
var cdb = require('cartodb.js-v3');
var PublicMapInfoView = require('../../../../javascripts/cartodb/public_map/public_map_info_static');
var vizdataJson = require('../../vizdata_sample.json');
var userdataJson = require('../../userdata_sample.json');
var moment = require('moment');

var CURRENT_USER = new cdb.admin.User(userdataJson.user_data);
var DATA = userdataJson;
var VIZDATA = vizdataJson;

describe('public_map/public_map_info_static', function () {
  it('should render', function () {
    var daysAgo = moment(vizdataJson.updated_at).fromNow();

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA
    });

    this.view.render();

    expect(this.view.el).toBeDefined();
    expect(this.view.template).toBeDefined();
    expect(this.view.$('.PublicMap-title').text().trim()).toEqual(VIZDATA.name);
    expect(this.view.$('.PublicMap-description').text().trim()).toEqual(VIZDATA.description);

    expect($(this.view.$('.PublicMap-metaItem')[0]).text().trim()).toEqual('Updated ' + daysAgo);
    expect($(this.view.$('.PublicMap-metaItem')[1]).text().trim()).toEqual('6');
    expect(this.view.$('.Navmenu-editLink Navmenu-editLink--more js-Navmenu-editLink--more').length).toBeDefined();
  });

  it('should have no tags', function () {
    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA
    });

    this.view.render();

    expect(this.view.$('.PublicMap-metaLink').length).toBe(0);
  });

  it('should have three visible tags', function () {
    var vizdataWithTags = _.extend(VIZDATA, {
      tags: ['tag1', 'tag2']
    })

    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      data: DATA,
      vizdata: vizdataWithTags
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
      data: DATA,
      vizdata: vizdataWithTags
    });

    this.view.render();

    expect(this.view.$('.PublicMap-metaLink').length).toBe(3);
    expect($(this.view.$('.PublicMap-metaItem')[2]).text().split(/[\s|\n]/).join('')).toEqual('tag1,tag2,tag3and2more');
  });

  it('should have a disqus view if disqus shortname is provided', function () {
    this.view = new PublicMapInfoView({
      currentUser: CURRENT_USER,
      data: DATA,
      vizdata: VIZDATA
    });

    this.view.render();

    expect(this.view.$('.js-disqus').length).toBe(1);
  });

  afterEach(function () {
    this.view.clean();
    window.defaultFallbackBasemapTemplateUrl = undefined;
    delete window.defaultFallbackBasemapTemplateUrl;
  });
});
