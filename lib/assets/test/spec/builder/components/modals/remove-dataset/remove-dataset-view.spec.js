var Backbone = require('backbone');
var _ = require('underscore');
var RemoveDatasetView = require('builder/components/modals/remove-dataset/remove-dataset-view');
var UserModel = require('builder/data/user-model');
var VisDefinitionModel = require('builder/data/vis-definition-model');
var TableModel = require('builder/data/table-model');
var ConfigModel = require('builder/data/config-model');

describe('modals/remove-dataset-view', function () {
  var modalModel = new Backbone.Model();
  var avatarBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAADElEQVQI12P4//8/AAX+Av7czFnnAAAAAElFTkSuQmCC';
  var configData = {
    base_url: '/u/manolo',
    maps_api_template: 'http://{user}.localhost.lan:8181'
  };
  var userData = {
    id: '8c253a9a-94d8-4042-883c-3aa81285e5e6',
    username: 'cdb',
    organization: {
      display_name: 'Globex Corporation',
      name: 'globex',
      avatar_url: 'https://s3.amazonaws.com/com.cartodb.users-assets.staging/development/cdb/assets/20161028125910fake-company-logo.jpg',
      user_count: 25
    }
  };
  var tableDataWithNoDependentMaps = {
    name: 'NYC Graffiti sights',
    accessible_dependent_derived_maps: [],
    accessible_dependent_derived_maps_count: 0
  };
  var dependentMap = {
    id: '5725afbe-9f51-11e6-af45-080027eb929e',
    name: 'Untitled Map',
    permission: {
      owner: {
        username: 'cdb'
      }
    },
    updated_at: '2016-10-31T10:03:58+00:00'
  };
  var visDataWithNoACL = {
    permission: {
      acl: []
    }
  };
  var visDataWithOrganizationACL = {
    permission: {
      acl: [{
        type: 'org',
        entity: {
          id: 'c210c579-0780-4ccd-83a8-7bf9fee11b34',
          name: 'globex',
          avatar_url: avatarBase64
        }
      }]
    }
  };
  var visDataWithGroupACL = {
    permission: {
      acl: [{
        type: 'group',
        entity: {
          users: [{
            username: 'Meowth',
            avatar_url: avatarBase64
          }]
        }
      }]
    }
  };
  var visModel;
  var configModel;
  var tableModel;
  var userModel;
  var view;

  function createDependantACL (username) {
    return {
      type: 'user',
      entity: {
        username: username || 'pepe' + _.random(99999).toString(),
        avatar_url: avatarBase64
      }
    };
  }

  function createView (options) {
    var opts = options || {};
    var numberOfDependentMaps = opts.numberOfDependentMaps || 0;
    var organizationAffected = opts.organizationAffected || false;
    var numberOfDependentEntities = opts.numberOfDependentEntities || 0;
    var repeatAffectedEntity = opts.repeatAffectedEntity || false;
    var affectedGroup = opts.affectedGroup || false;
    var tableData;
    var visData;

    configModel = new ConfigModel(configData);
    userModel = new UserModel(userData, { configModel: configModel });

    if (numberOfDependentMaps > 0) {
      tableData = _.clone(tableDataWithNoDependentMaps);
      tableData.accessible_dependent_derived_maps_count = numberOfDependentMaps;
      _.times(numberOfDependentMaps, function () {
        tableData.accessible_dependent_derived_maps.push(dependentMap);
      });
      tableModel = new TableModel(tableData, { parse: true, configModel: configModel });
    } else {
      tableModel = new TableModel(tableDataWithNoDependentMaps, { parse: true, configModel: configModel });
    }

    if (organizationAffected) {
      visModel = new VisDefinitionModel(visDataWithOrganizationACL, {
        configModel: configModel
      });
    } else if (affectedGroup) {
      visModel = new VisDefinitionModel(visDataWithGroupACL, {
        configModel: configModel
      });
    } else if (numberOfDependentEntities > 0) {
      visData = {
        permission: {
          acl: []
        }
      };
      _.times(numberOfDependentEntities, function () {
        visData.permission.acl.push(createDependantACL());
      });
      visData.permission.acl.push(createDependantACL(userData.username)); // To test if we filter ourselves
      if (repeatAffectedEntity) {
        visData.permission.acl.push(_.clone(visData.permission.acl[0])); // Repeat one user to test if we filter only uniques
      }
      visModel = new VisDefinitionModel(visData, {
        configModel: configModel
      });
    } else {
      visModel = new VisDefinitionModel(visDataWithNoACL, {
        configModel: configModel
      });
    }

    return new RemoveDatasetView({
      modalModel: modalModel,
      userModel: userModel,
      visModel: visModel,
      tableModel: tableModel,
      configModel: configModel
    });
  }

  describe('render', function () {
    it('Nothing affected, visualization and entities sections not shown', function () {
      // Arrange
      view = createView();

      // Act
      view.render();

      // Assert
      expect(view.$('h2')[0].textContent.trim()).toEqual('dataset.delete.title');
      expect(view.$('.MapsList-item').length).toBe(0);
      expect(view.$('.ShareUser').length).toBe(0);
      expect(view.$('button.js-cancel > span')[0].textContent.trim()).toEqual('dataset.delete.cancel');
      expect(view.$('button.js-confirm > span')[0].textContent.trim()).toEqual('dataset.delete.confirm');
    });

    it('1 visualization affected. Visualization gets properly rendered.', function () {
      // Arrange
      view = createView({ numberOfDependentMaps: 1 });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedVis > p')[0].textContent.trim()).toEqual('dataset.delete.affected-vis-count');
      expect(view.$('.js-affectedVis > ul > li').length).toBe(1);
      expect(view.$('.MapCard')[0].dataset['visId']).toEqual(dependentMap.id);
      expect(view.$('.MapCard')[0].dataset['visOwnerName']).toEqual(dependentMap.permission.owner.username);
      expect(view.$('.MapCard > a')[0].href).toBeTruthy();
      expect(view.$('.MapCard > a > img')[0].src).toBeTruthy();
      expect(view.$('.MapCard-content h3 > a')[0].href).toBeTruthy();
      expect(view.$('.MapCard-content h3 > a')[0].title).toEqual(dependentMap.name);
      expect(view.$('.MapCard-contentBodyTimeDiff')[0].textContent.trim()).toBeTruthy();
    });

    it('More vis affected than AFFECTED_VIS_COUNT. Text changed to extended one.', function () {
      // Arrange
      var maxAffectedVisCount = 3; // AFFECTED_VIS_COUNT
      view = createView({ numberOfDependentMaps: 4 });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedVis > p')[0].textContent.trim()).toEqual('dataset.delete.affected-vis-count-extended');
      expect(view.$('.js-affectedVis > ul > li').length).toBe(maxAffectedVisCount);
    });

    it('Organization affected. Proper text and avatar rendered.', function () {
      // Arrange
      var userNode;
      view = createView({ organizationAffected: true });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedEntities > p')[0].textContent.trim()).toEqual('dataset.delete.whole-organization-affected');
      expect(view.$('.js-affectedEntities li').length).toBe(1);
      userNode = view.$('.js-affectedEntities li .Share-user')[0];
      expect(userNode.title).toEqual(userData.organization.display_name);
      expect(userNode.dataset['username']).toEqual(userData.organization.display_name);
      expect(userNode.style.backgroundImage.indexOf(userData.organization.avatar_url) > -1).toBe(true);
    });

    it('1 user affected. Proper text and avatar rendered.', function () {
      // Arrange
      var userNode;
      var affectedEntity;
      view = createView({ numberOfDependentEntities: 1 });
      affectedEntity = view._visModel._permissionModel.get('acl')[0].entity;

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedEntities > p')[0].textContent.trim()).toEqual('dataset.delete.affected-entities-count');
      expect(view.$('.js-affectedEntities li').length).toBe(1);
      userNode = view.$('.js-affectedEntities li .Share-user')[0];
      expect(userNode.title).toEqual(affectedEntity.username);
      expect(userNode.dataset['username']).toEqual(affectedEntity.username);
      expect(userNode.style.backgroundImage.indexOf(affectedEntity.avatar_url) > -1).toBe(true);
    });

    it('More user affected than AFFECTED_ENTITIES_SAMPLE_COUNT. Text changed to extended.', function () {
      // Arrange
      var affectedEntitiesSampleCount = 20; // AFFECTED_ENTITIES_SAMPLE_COUNT
      view = createView({ numberOfDependentEntities: affectedEntitiesSampleCount + 1 });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedEntities > p')[0].textContent.trim()).toEqual('dataset.delete.affected-entities-count-extended');
      expect(view.$('.js-affectedEntities li').length).toBe(affectedEntitiesSampleCount);
    });

    it('Affected entity repeated. Repeated entity gets filtered.', function () {
      // Arrange
      view = createView({
        numberOfDependentEntities: 2,
        repeatAffectedEntity: true
      });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedEntities li').length).toBe(2);
    });

    it('Affected group. Users of that group get rendered.', function () {
      // Arrange
      view = createView({
        affectedGroup: true
      });

      // Act
      view.render();

      // Assert
      expect(view.$('.js-affectedEntities li').length).toBe(visDataWithGroupACL.permission.acl[0].entity.users.length);
    });
  });

  describe('_runAction', function () {
    it('Renders loading view and destory has been set to the right success function.', function () {
      // Arrange
      var successFunction;
      view = createView();
      spyOn(view, '_renderLoadingView');
      spyOn(view, '_onSuccessDestroyDataset');
      spyOn(visModel, 'destroy').and.callFake(function (args) {
        successFunction = args.success;
      });

      // Act
      view._runAction();
      successFunction();

      // Assert
      expect(view._renderLoadingView).toHaveBeenCalled();
      expect(view._onSuccessDestroyDataset).toHaveBeenCalled();
    });

    it('Destroy has been set to the right error function.', function () {
      // Arrange
      var errorFunction;
      view = createView();
      spyOn(view, '_onErrorDestroyDataset');
      spyOn(visModel, 'destroy').and.callFake(function (args) {
        errorFunction = args.error;
      });

      // Act
      view._runAction();
      errorFunction(null, {});

      // Assert
      expect(view._onErrorDestroyDataset).toHaveBeenCalled();
    });
  });

  it('_renderLoadingView inserts the right HTML', function () {
    // Arrange
    view = createView();

    // Act
    view._renderLoadingView();

    // Assert
    expect(view.$('.js-loader').length).toBeGreaterThan(0);
  });

  it('_onErrorDestroyDataset inserts the right HTML', function () {
    // Arrange
    view = createView();

    // Act
    view._onErrorDestroyDataset(null, {});

    // Assert
    expect(view.$('i.CDB-IconFont-cockroach').length).toBeGreaterThan(0);
  });
});
