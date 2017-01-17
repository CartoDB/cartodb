var IconPickerView = require('../../../../../javascripts/cartodb/organization/icons/organization_icon_picker_view.js');
var IconModel = require('../../../../../javascripts/cartodb/organization/icons/organization_icon_model');
var _ = require('underscore-cdb-v3');
var Backbone = require('backbone-cdb-v3');

describe('organization/icons/organization_icon_picker_view', function () {
  var orgId = '5p3c724-1ndv572135';
  var successResponse = { status: 200 };

  function getIconModel (index) {
    var icon = new IconModel();
    icon.set('index', index || 1);

    return icon;
  }

  beforeEach(function () {
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/assets'))
      .andReturn(successResponse);

    this.view = new IconPickerView({
      orgId: orgId
    });
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  describe('.initialize', function () {
    it('should initialize properly', function () {
      expect(this.view._maxIcons).toBe(23);
      expect(this.view.template).toBeDefined();
      expect(this.view.orgId).toEqual(orgId);
      expect(this.view.model).toBeDefined();
      expect(this.view.model.get('isProcessRunning')).toBe(false);
      expect(this.view._iconCollection).toBeDefined();
      expect(this.view._iconCollection.orgId).toEqual(orgId);
      expect(this.view._numOfUploadingProcesses).toBe(0);
      expect(this.view._numOfDeletingProcesses).toBe(0);
      expect(this.view._fetchErrorMessage).toEqual('Error fetching your icons. Please refresh the page.');
      expect(this.view._runningMessage).toEqual('');
      // Render called
      expect(this.view.$('.js-iconMainLabel').length).toBe(1);
      // Fetch icons
      var request = jasmine.Ajax.requests.filter('/api/v1/organization/' + orgId + '/assets');
      expect(request.length).toBe(1);
      // Called _initBinds
      expect(this.view._iconCollection._callbacks['change:selected']).toBeDefined();
      expect(this.view.model._callbacks['change:isProcessRunning']).toBeDefined();
    });

    it('should fail if no OrgId provided', function () {
      expect(function () {
        new IconPickerView();
      }).toThrowError('Organization ID is required.');
    });
  });

  describe('.render', function () {
    it('should have rendered the right template', function () {
      // Just checking that the important nodes are here
      var label = this.view.$('.FormAccount-rowLabel');
      expect(label.find('.js-iconMainLabel').length).toBe(1);
      expect(label.find('.js-viewAllIcons').length).toBe(1);
      expect(label.find('.js-iconsInfo').length).toBe(1);
      expect(label.find('.js-runningInfo').length).toBe(1);
      expect(label.find('.js-selectAllIcons').length).toBe(1);
      expect(label.find('.js-deselectAllIcons').length).toBe(1);
      expect(label.find('.js-deleteIcons').length).toBe(1);
      var icons = this.view.$('.js-asset-icons');
      expect(icons.find('.js-items').length).toBe(1);
      expect(icons.find('.js-addIcon').length).toBe(1);
      expect(icons.find('.js-plusSign').length).toBe(1);
      expect(icons.find('.js-spinner').length).toBe(1);
      expect(this.view.$('.js-errorMessage').length).toBe(1);
      expect(this.view.$('input[type=file]').length).toBe(1);
    });
  });

  describe('.initBinds', function () {
    it('should hook up ', function () {
      spyOn(this.view, '_refreshActions');
      spyOn(this.view, '_onProcessRunningChanged');

      this.view._initBinds();
      this.view._iconCollection.trigger('change:selected');
      this.view.model.trigger('change:isProcessRunning');

      expect(this.view._refreshActions).toHaveBeenCalled();
      expect(this.view._onProcessRunningChanged).toHaveBeenCalled();
    });
  });

  describe('._fetchAllIcons', function () {
    it('should call success callback if success', function () {
      spyOn(this.view, '_renderAllIcons');
      this.view._iconCollection.fetch = function (callbacks) {
        callbacks.success();
      };

      this.view._fetchAllIcons();

      expect(this.view._renderAllIcons).toHaveBeenCalled();
    });

    it('should call error callback if error', function () {
      spyOn(this.view, '_onFetchIconsError');
      this.view._iconCollection.fetch = function (callbacks) {
        callbacks.error();
      }

      this.view._fetchAllIcons();

      expect(this.view._onFetchIconsError).toHaveBeenCalled();
    });
  });


  describe('._renderAllIcons', function () {
    it('should call _addIconElement for each collection member', function () {
      this.view._iconCollection.models = [1, 2, 3];
      spyOn(this.view, '_addIconElement');

      this.view._renderAllIcons();

      expect(this.view._addIconElement).toHaveBeenCalledTimes(3);
      expect(this.view._addIconElement).toHaveBeenCalledWith(1);
      expect(this.view._addIconElement).toHaveBeenCalledWith(2);
      expect(this.view._addIconElement).toHaveBeenCalledWith(3);
    });
  });

  describe('._onFetchIconsError', function () {
    it('should call _showErrorMessage with the proper message', function () {
      spyOn(this.view, '_showErrorMessage');

      this.view._onFetchIconsError();

      expect(this.view._showErrorMessage).toHaveBeenCalledWith(this.view._fetchErrorMessage);
    });
  });

  describe('._renderIcon', function () {
    it('if less than max icons then the icon gets rendered', function () {
      var iconModel = getIconModel(); 

      this.view._renderIcon(iconModel);

      expect(this.view.$('.js-items').children().length).toBe(2);
    });

    it('if more than max icons then the icon gets not rendered', function () {
      var iconModel = getIconModel(this.view._maxIcons + 1);

      this.view._renderIcon(iconModel);

      expect(this.view.$('.js-items').children().length).toBe(1);
    });
  });

  describe('._addIconElement', function () {
    it('should set index, render icon and refresh actions', function () {
      var iconModel = getIconModel(303);
      this.view._iconCollection.add(iconModel);
      spyOn(this.view, '_renderIcon');
      spyOn(this.view, '_refreshActions');

      this.view._addIconElement(iconModel);

      expect(iconModel.get('index')).toBe(0);
      expect(this.view._renderIcon).toHaveBeenCalledWith(iconModel);
      expect(this.view._refreshActions).toHaveBeenCalled();
    });
  });

  describe('._onAddIconClicked', function () {
    it('should hide error message, trigger input click and prevent default', function () {
      var preventDefaultCalled = false;
      var clickTriggered = false;
      var event = {
        preventDefault: function () {
          preventDefaultCalled = true;
        }
      };
      this.view.$('#iconfile').on('click', function () {
        clickTriggered = true;
      });
      spyOn(this.view, '_hideErrorMessage');

      this.view._onAddIconClicked(event);

      expect(this.view._hideErrorMessage).toHaveBeenCalled();
      expect(preventDefaultCalled).toBe(true);
      expect(clickTriggered).toBe(true);
    });
  });

  describe('._parseResponseText', function () {
    it('should return empty if no response given', function () {
      var text = this.view._parseResponseText();

      expect(text).toEqual('');
    });

    it('should return empty if no responseText property is present', function () {
      var response = {};
      var text = this.view._parseResponseText(response);

      expect(text).toEqual('');
    });

    it('should return errors if property is present', function () {
      var errors = {
        errors: 'something happened'
      };
      var response = {
        responseText: JSON.stringify(errors)
      };

      var text = this.view._parseResponseText(response);

      expect(text).toEqual(errors.errors);
    });

    it('should return empty if property is present but not parseable', function () {
      var response = {
        responseText: 'not valid JSON'
      };

      var text = this.view._parseResponseText(response);

      expect(text).toEqual('');
    });
  });

  describe('._getSelectedFiles', function () {
    it('should retrieve selected files from input', function () {
      var files = this.view._getSelectedFiles();
      var prototypeName = Object.getPrototypeOf(files).toString();

      expect(prototypeName.indexOf('FileList') > -1).toBe(true);
    });
  });

  describe('._onFileSelected', function () {
    var createCalls = [];

    function mockCreate () {
      this.view._iconCollection.create = function (options, callbacks) {
        var createCall = {
          kind: options.kind,
          resource: options.resource,
          callbacks: callbacks
        };
        createCalls.push(createCall);
      };
    }

    it('should create an icon model for each selected file', function () {
      var files = ['one', 'two'];
      mockCreate.call(this);
      spyOn(this.view, '_getSelectedFiles').and.returnValue(files);
      spyOn(this.view, '_beforeIconUpload');
      spyOn(this.view, '_onIconUploaded');
      spyOn(this.view, '_onIconUploadError');
      spyOn(this.view, '_onIconUploadComplete');

      this.view._onFileSelected();

      expect(createCalls.length).toBe(2);
      expect(createCalls[0].kind).toEqual('organization_asset');
      expect(createCalls[0].resource).toEqual(files[0]);
      expect(createCalls[1].kind).toEqual('organization_asset');
      expect(createCalls[1].resource).toEqual(files[1]);

      // Assert that every request callback has been hooked up
      createCalls[0].callbacks['beforeSend']();
      expect(this.view._beforeIconUpload).toHaveBeenCalled();
      createCalls[0].callbacks['success']();
      expect(this.view._onIconUploaded).toHaveBeenCalled();
      createCalls[0].callbacks['error']();
      expect(this.view._onIconUploadError).toHaveBeenCalled();
      createCalls[0].callbacks['complete']();
      expect(this.view._onIconUploadComplete).toHaveBeenCalled();
    });
  });

  describe('._beforeIconUpload', function () {
    it('should set `isProcessRunning` properly', function () {
      this.view._beforeIconUpload();

      expect(this.view._numOfUploadingProcesses).toBe(1);
      expect(this.view._runningMessage).toEqual('Uploading icons...');
      expect(this.view.model.get('isProcessRunning')).toBe(true);
    });
  });

  describe('._onIconUploaded', function () {
    it('should reset selection, add the icon and refresh the action bar', function () {
      spyOn(this.view, '_resetFileSelection');
      spyOn(this.view, '_addIconElement');
      spyOn(this.view, '_refreshActions');

      this.view._onIconUploaded('icon');

      expect(this.view._resetFileSelection).toHaveBeenCalled();
      expect(this.view._addIconElement).toHaveBeenCalledWith('icon');
      expect(this.view._refreshActions).toHaveBeenCalled();
    });
  });

  describe('._onIconUploadError', function () {
    it('should reset selection and show the proper error message', function () {
      spyOn(this.view, '_parseResponseText').and.returnValue('an error text');
      spyOn(this.view, '_resetFileSelection');
      spyOn(this.view, '_uploadErrorMessage').and.returnValue('upload error');
      spyOn(this.view, '_showErrorMessage');

      this.view._onIconUploadError('whatever', 'response')

      expect(this.view._parseResponseText).toHaveBeenCalledWith('response');
      expect(this.view._resetFileSelection).toHaveBeenCalled();
      expect(this.view._uploadErrorMessage).toHaveBeenCalledWith('an error text');
      expect(this.view._showErrorMessage).toHaveBeenCalledWith('upload error');
    });
  });

  describe('._onIconUploadComplete', function () {
    it('should set `isProcessRunning` properly', function () {
      this.view._numOfUploadingProcesses = 1;

      this.view._onIconUploadComplete();

      expect(this.view._numOfUploadingProcesses).toBe(0);
      expect(this.view.model.get('isProcessRunning')).toBe(false);
    });
  });

  describe('_show and _hide', function () {
    it('_show remove `is-hidden` class', function () {
      // Premise: an element with `is-hidden` class exists
      var $hiddenElement = this.view.$('.js-viewAllIcons')
      expect($hiddenElement.length).toBeGreaterThan(0);
      expect($hiddenElement.hasClass('is-hidden')).toBe(true);

      this.view._show('.js-viewAllIcons');

      expect($hiddenElement.hasClass('is-hidden')).toBe(false);
    });

    it('_hide adds `is-hidden` class', function () {
      // Premise: an element with no `is-hidden` class exists
      var $shownElement = this.view.$('.js-iconMainLabel')
      expect($shownElement.length).toBeGreaterThan(0);
      expect($shownElement.hasClass('is-hidden')).toBe(false);

      this.view._hide('.js-iconMainLabel');

      expect($shownElement.hasClass('is-hidden')).toBe(true);
    });
  });

  describe('_refreshActions', function () {
    var isHidden;
    function isHiddenFn(selector) {
      return this.view.$(selector).hasClass('is-hidden');
    }

    beforeEach(function () {
      isHidden = isHiddenFn.bind(this);
    });

    it('should do nothing if some process is running', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons');
      this.view.model.set('isProcessRunning', true);

      this.view._refreshActions();

      expect(this.view._getNumberOfSelectedIcons).not.toHaveBeenCalled();
    });

    it('should show only info if no icon is selected', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons').and.returnValue(0);

      this.view._refreshActions();

      expect(this.view.$('.js-iconMainLabel').text()).toEqual('Icons');
      expect(isHidden('.js-selectAllIcons')).toBe(true);
      expect(isHidden('.js-deselectAllIcons')).toBe(true);
      expect(isHidden('.js-deleteIcons')).toBe(true);
      expect(isHidden('.js-iconsInfo')).toBe(false);
    });

    it('should show `select all` and `delete icons` if some icons are selected', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons').and.returnValue(2);
      this.view._iconCollection = [1, 2, 3, 4];

      this.view._refreshActions();

      expect(this.view.$('.js-iconMainLabel').text()).toEqual('2 icons selected');
      expect(isHidden('.js-selectAllIcons')).toBe(false);
      expect(isHidden('.js-deselectAllIcons')).toBe(true);
      expect(isHidden('.js-deleteIcons')).toBe(false);
      expect(isHidden('.js-iconsInfo')).toBe(true);
    });

    it('should show `deselect all` and `delete icons` if all icons are selected', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons').and.returnValue(3);
      this.view._iconCollection = [1, 2, 3];

      this.view._refreshActions();

      expect(this.view.$('.js-iconMainLabel').text()).toEqual('3 icons selected');
      expect(isHidden('.js-selectAllIcons')).toBe(true);
      expect(isHidden('.js-deselectAllIcons')).toBe(false);
      expect(isHidden('.js-deleteIcons')).toBe(false);
      expect(isHidden('.js-iconsInfo')).toBe(true);
      expect(isHidden('.js-viewAllIcons')).toBe(true);
    });

    it('should show `View all icons` if there are more than max', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons').and.returnValue(0);
      this.view._iconCollection = new Array(this.view._maxIcons + 1);

      this.view._refreshActions();

      expect(isHidden('.js-viewAllIcons')).toBe(false);
    });
  });

  describe('_onDeselectAllIconsClicked', function () {
    it('should prevent default and deselect all icons', function () {
      var preventDefaultCalled = false;
      var event = {
        preventDefault: function () {
          preventDefaultCalled = true;
        }
      };
      this.view._iconCollection.push(getIconModel(0).set('selected', true));
      this.view._iconCollection.push(getIconModel(1).set('selected', true));

      this.view._onDeselectAllIconsClicked(event);

      expect(preventDefaultCalled).toBe(true);
      expect(this.view._iconCollection.at(0).get('selected')).toBe(false);
      expect(this.view._iconCollection.at(1).get('selected')).toBe(false);
    });
  });

  describe('_onSelectAllIconsClicked', function () {
    it('should prevent default and select all visible icons', function () {
      var preventDefaultCalled = false;
      var event = {
        preventDefault: function () {
          preventDefaultCalled = true;
        }
      };
      this.view._iconCollection.push(getIconModel(0).set('visible', true));
      this.view._iconCollection.push(getIconModel(1).set('visible', true));
      this.view._iconCollection.push(getIconModel(2));

      this.view._onSelectAllIconsClicked(event);

      expect(preventDefaultCalled).toBe(true);
      expect(this.view._iconCollection.at(0).get('selected')).toBe(true);
      expect(this.view._iconCollection.at(1).get('selected')).toBe(true);
      expect(this.view._iconCollection.at(2).get('selected')).toBe(false);
    });
  });

});