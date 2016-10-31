var Backbone = require('backbone');
var fixture = require('../../../../../jasmine/helpers/fixture');
var RemoveDatasetView = require('../../../../../../javascripts/cartodb3/components/modals/remove-dataset/remove-dataset-view');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
var VisDefinitionModel = require('../../../../../../javascripts/cartodb3/data/vis-definition-model');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('modals/remove-dataset-view', function () {
  var modalModel = new Backbone.Model();
  var tableName = 'NYC Graffiti sights';
  var basicMap = {
    id: "5725afbe-9f51-11e6-af45-080027eb929e",
    name: "A basic Map",
    updated_at: "2016-10-31T10:03:58+00:00",
    permission: {
      id: "4f68928d-09e2-4873-8ec6-902cc5d2f6f4",
      owner: {
        id: "8c253a9a-94d8-4042-883c-3aa81285e5e6",
        username: "cdb",
      }
    },
    url: "http://globex.localhost.lan:3000/u/cdb/viz/5725afbe-9f51-11e6-af45-080027eb929e/map"
  };
  var avatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC';
  var view;
  var userModel;
  var visModel;
  var tableModel;
  var configModel;
  var permissionModel;
  var acl;

  function mockDependentMaps(tableModel, dependentMaps) {
      var params = { 'accessible_dependent_derived_maps': dependentMaps };
      spyOn(tableModel, 'get').and.callFake(function (myParam) {
          return params[myParam];
      });
  }

  function mockAffectedEntities(view, affectedEntities) {
    spyOn(view, '_prepareVisibleAffectedEntities').and.returnValue(affectedEntities);
  }

  function createView() {
    configModel = new ConfigModel({
      base_url: '/u/manolo',
      maps_api_template: 'http://{user}.localhost.lan:8181'
    });
        
    userModel = new UserModel(null, {
      configModel: configModel
    });

    acl = new Backbone.Collection();
    permissionModel = new Backbone.Model();
    permissionModel.acl = acl;

    visModel = new VisDefinitionModel({
      name: 'Patatas Bravas',
      id: 'v-123',
      permission: permissionModel
    }, {
      configModel: configModel
    });

    tableModel = new Backbone.Model();
    tableModel.getUnquotedName = function () { return tableName; };

    return new RemoveDatasetView({
      modalModel: modalModel,
      userModel: userModel,
      visModel: visModel,
      tableModel: tableModel,
      configModel: configModel
    });
  }

  beforeEach(function () {
    fixture.createFixture();
    view = createView();
  });

  afterEach(function () {
    fixture.removeFixture();
  });

  it('render - nothing affected, visualization and entities sections not shown', function () {
      // Arrange
      mockDependentMaps(tableModel, []);
      mockAffectedEntities(view, {
        organizationAffected: false,
        count: 0,
        data: []
      });

      // Act
      view.render();
      fixture.addToFixture(view.$el.html());

      // Assert
      expect(document.getElementsByTagName('h2')[0].textContent.trim()).toEqual('dataset.delete.title');
      expect(document.querySelector('.MapsList-item')).toBe(null);
      expect(document.querySelector('.ShareUser')).toBe(null);      
      expect(document.querySelector('button.js-cancel > span').textContent.trim()).toEqual('dataset.delete.cancel');
      expect(document.querySelector('button.js-confirm > span').textContent.trim()).toEqual('dataset.delete.confirm');
  });

  it('render - 1 visualization affected. Visualization gets properly rendered.', function () {
      // Arrange
      mockDependentMaps(tableModel, [ basicMap ]);

      // Act
      view.render();
      fixture.addToFixture(view.$el.html());

      // Assert
      expect(document.querySelector('.js-affectedVis > p').textContent.trim()).toEqual('dataset.delete.affected-vis-count');
      expect(document.querySelectorAll('.js-affectedVis > ul > li').length).toBe(1);
      expect(document.querySelector('.MapCard').dataset['visId']).toEqual(basicMap.id);
      expect(document.querySelector('.MapCard').dataset['visOwnerName']).toEqual(basicMap.permission.owner.username);
      expect(document.querySelector('.MapCard > a').href).toBeTruthy();
      expect(document.querySelector('.MapCard > a > img').src).toBeTruthy();
      expect(document.querySelector('.MapCard-content h3 > a').href).toBeTruthy();
      expect(document.querySelector('.MapCard-content h3 > a').title).toEqual(basicMap.name);
      expect(document.querySelector('.MapCard-contentBodyTimeDiff').textContent.trim()).toBeTruthy();
  });

  it('render - more vis affected than AFFECTED_VIS_COUNT. Text changed to extended one.', function () {
      // Arrange
      var dependentMaps = [ basicMap, basicMap, basicMap, basicMap ];
      var maxAffectedVisCount = 3;  // AFFECTED_VIS_COUNT
      mockDependentMaps(tableModel, dependentMaps);

      // Act
      view.render();
      fixture.addToFixture(view.$el.html());

      // Assert
      expect(document.querySelector('.js-affectedVis > p').textContent.trim()).toEqual('dataset.delete.affected-vis-count-extended');
      expect(document.querySelectorAll('.js-affectedVis > ul > li').length).toBe(maxAffectedVisCount);      
  });

  it('render - organization affected. Proper text and avatar rendered.', function () {
    // Arrange
    var affectedOrganization = {
      username: 'The Organization',
      avatarUrl: avatarBase64
    };
    var userNode;
    mockDependentMaps(tableModel, []);
    mockAffectedEntities(view, {
      organizationAffected: true,
      count: 0,
      data: [affectedOrganization]
    });

    // Act
    view.render();
    fixture.addToFixture(view.$el.html());

    // Assert
    expect(document.querySelector('.js-affectedEntities > p').textContent.trim()).toEqual('dataset.delete.whole-organization-affected');
    expect(document.querySelectorAll('.js-affectedEntities li').length).toBe(1);
    userNode = document.querySelector('.js-affectedEntities li .Share-user');
    expect(userNode.title).toEqual(affectedOrganization.username);
    expect(userNode.dataset['username']).toEqual(affectedOrganization.username);
    expect(userNode.style.backgroundImage.indexOf(affectedOrganization.avatarUrl) > -1).toBe(true);
  });

  it('render - 1 user affected. Proper text and avatar rendered.', function () {
    // Arrange
    var affectedEntity = {
      username: 'Curtis Jackson',
      avatarUrl: avatarBase64
    };
    var userNode;
    mockDependentMaps(tableModel, []);
    mockAffectedEntities(view, {
      organizationAffected: false,
      count: 1,
      data: [affectedEntity]
    });

    // Act
    view.render();
    fixture.addToFixture(view.$el.html());

    // Assert
    expect(document.querySelector('.js-affectedEntities > p').textContent.trim()).toEqual('dataset.delete.affected-entities-count');
    expect(document.querySelectorAll('.js-affectedEntities li').length).toBe(1);
    userNode = document.querySelector('.js-affectedEntities li .Share-user');
    expect(userNode.title).toEqual(affectedEntity.username);
    expect(userNode.dataset['username']).toEqual(affectedEntity.username);
    expect(userNode.style.backgroundImage.indexOf(affectedEntity.avatarUrl) > -1).toBe(true);
  });

  it('render - more user affected than AFFECTED_ENTITIES_SAMPLE_COUNT. Text changed to extended.', function () {
    // Arrange
    var affectedEntity = {
      username: 'Curtis Jackson',
      avatarUrl: avatarBase64
    };
    var affectedEntitiesSampleCount = 20; // AFFECTED_ENTITIES_SAMPLE_COUNT
    var entityList = [];
    for (var i = 0; i < affectedEntitiesSampleCount + 1; i++) {
        entityList.push(affectedEntity)
    };
    mockDependentMaps(tableModel, []);
    mockAffectedEntities(view, {
      organizationAffected: false,
      count: entityList.length,
      data: entityList
    });

    // Act
    view.render();
    fixture.addToFixture(view.$el.html());

    // Assert
    expect(document.querySelector('.js-affectedEntities > p').textContent.trim()).toEqual('dataset.delete.affected-entities-count-extended');
    expect(document.querySelectorAll('.js-affectedEntities li').length).toBe(affectedEntitiesSampleCount);
  });

});