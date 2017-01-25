var cdb = require('cartodb.js-v3');
var IconPickerView = require('../../../../../javascripts/cartodb/organization/icon_picker/organization_icon_picker_view');
var IconModel = require('../../../../../javascripts/cartodb/organization/icon_picker/icons/organization_icon_model');

describe('organization/icon_picker/organization_icon_picker_view', function () {
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
      expect(this.view._orgId).toEqual(orgId);
      expect(this.view.model).toBeDefined();
      expect(this.view.model.get('isProcessRunning')).toBe(false);
      expect(this.view._iconCollection).toBeDefined();
      expect(this.view._iconCollection._orgId).toEqual(orgId);
      expect(this.view._numOfUploadingProcesses).toBe(0);
      expect(this.view._numOfDeletingProcesses).toBe(0);
      expect(this.view._fetchErrorMessage).toEqual('Error fetching organization icons. Please refresh the page.');
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

    it('should fail if no user provided', function () {
      expect(function () {
        new IconPickerView(); // eslint-disable-line
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

  describe('._renderIcon', function () {
    it('if less than max icons then the icon gets rendered', function () {
      var iconModel = getIconModel();

      expect(iconModel.get('visible')).toBe(false);

      this.view._renderIcon(iconModel);

      expect(this.view.$('.js-items').children().length).toBe(2);
      expect(iconModel.get('visible')).toBe(true);
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

  describe('_refreshActions', function () {
    var isHidden;
    function isHiddenFn (selector) {
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
      this.view._iconCollection.push(getIconModel());
      this.view._iconCollection.push(getIconModel());
      this.view._iconCollection.push(getIconModel());
      this.view._iconCollection.push(getIconModel());

      this.view._refreshActions();

      expect(this.view.$('.js-iconMainLabel').text()).toEqual('2 icons selected');
      expect(isHidden('.js-selectAllIcons')).toBe(false);
      expect(isHidden('.js-deselectAllIcons')).toBe(true);
      expect(isHidden('.js-deleteIcons')).toBe(false);
      expect(isHidden('.js-iconsInfo')).toBe(true);
    });

    it('should show `deselect all` and `delete icons` if all icons are selected', function () {
      spyOn(this.view, '_getNumberOfSelectedIcons').and.returnValue(3);
      this.view._iconCollection.push(getIconModel());
      this.view._iconCollection.push(getIconModel());
      this.view._iconCollection.push(getIconModel());

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
      for (var i = 0; i < this.view._maxIcons + 1; i++) {
        this.view._iconCollection.push(getIconModel());
      }

      this.view._refreshActions();

      expect(isHidden('.js-viewAllIcons')).toBe(false);
    });
  });

  describe('_getIconIndex', function () {
    it('should return the index of the icon within the collection', function () {
      var icon1 = getIconModel();
      var icon2 = getIconModel();

      expect(this.view._getIconIndex(icon2)).not.toBe(1);

      this.view._iconCollection.push(icon1);
      this.view._iconCollection.push(icon2);

      var index = this.view._getIconIndex(icon2);

      expect(index).toBe(1);
    });
  });

  describe('_addExtraIcon', function () {
    it('should add icon if more than max icons exist', function () {
      var icon1 = getIconModel().set('visible', true);
      var icon2 = getIconModel();
      var icon3 = getIconModel();
      this.view._iconCollection.push(icon1);
      this.view._iconCollection.push(icon2);
      this.view._iconCollection.push(icon3);
      spyOn(this.view, '_addIconElement');

      this.view._addExtraIcon();

      expect(this.view._addIconElement).toHaveBeenCalledTimes(1);
      expect(this.view._addIconElement).toHaveBeenCalledWith(icon2);
    });

    it('should not add icon if no more than max icons exist', function () {
      var icon1 = getIconModel().set('visible', true);
      var icon2 = getIconModel().set('visible', true);
      this.view._iconCollection.push(icon1);
      this.view._iconCollection.push(icon2);
      spyOn(this.view, '_addIconElement');

      this.view._addExtraIcon();

      expect(this.view._addIconElement).not.toHaveBeenCalled();
    });
  });

  describe('_onViewAllIconsClicked', function () {
    it('should open `all icons` dialog', function () {
      spyOn(this.view, 'killEvent').and.callThrough();
      spyOn(this.view, '_bindIconsPicker');

      expect(this.view.icon_picker_dialog).not.toBeDefined();
      this.view._onViewAllIconsClicked();
      expect(this.view.icon_picker_dialog).toBeDefined();

      expect(this.view.killEvent).toHaveBeenCalled();
      expect(this.view._bindIconsPicker).toHaveBeenCalled();
    });
  });

  describe('_hideActions', function () {
    it('should hide all actions', function () {
      spyOn(this.view, '_hide');

      this.view._hideActions();

      expect(this.view._hide).toHaveBeenCalledWith('.js-selectAllIcons, .js-deselectAllIcons, .js-deleteIcons, .js-iconsInfo, .js-viewAllIcons');
    });
  });

  describe('_bindIconsPicker', function () {
    it('should bind IconsPicker', function () {
      spyOn(this.view, '_destroyPicker');

      this.view._bindIconsPicker();
      cdb.god.trigger('closeDialogs:icons');

      expect(this.view._destroyPicker).toHaveBeenCalled();
    });
  });

  describe('_unbindIconsPicker', function () {
    it('should unbind IconsPicker', function () {
      spyOn(this.view, '_destroyPicker');

      this.view._bindIconsPicker();
      cdb.god.trigger('closeDialogs:icons');
      this.view._unbindIconsPicker();
      cdb.god.trigger('closeDialogs:icons');

      expect(this.view._destroyPicker).toHaveBeenCalledTimes(1);
    });
  });

  describe('_destroyPicker', function () {
    it('should destroy IconsPicker', function () {
      spyOn(this.view, '_unbindIconsPicker');
      spyOn(this.view, 'removeView');
      var removeCalled = false;
      var hideCalled = false;
      var icon_picker_dialog = this.view.icon_picker_dialog = {
        remove: function () { removeCalled = true; },
        hide: function () { hideCalled = true; }
      };

      expect(removeCalled).toBe(false);
      expect(hideCalled).toBe(false);
      expect(this.view.icon_picker_dialog).toBeDefined();

      this.view._destroyPicker();

      expect(this.view._unbindIconsPicker).toHaveBeenCalled();
      expect(removeCalled).toBe(true);
      expect(this.view.removeView).toHaveBeenCalledWith(icon_picker_dialog);
      expect(hideCalled).toBe(true);
      expect(this.view.icon_picker_dialog).not.toBeDefined();
    });
  });

  describe('._refreshCollection', function () {
    it('should be called when god triggers event and refresh if the caller is another view', function () {
      spyOn(this.view, '_refreshCollection').and.callThrough();
      spyOn(this.view, 'render');
      spyOn(this.view, '_fetchAllIcons');
      this.view._initBinds();

      cdb.god.trigger('refreshCollection', { cid: this.view.cid + 1 });

      expect(this.view._refreshCollection).toHaveBeenCalled();
      expect(this.view.render).toHaveBeenCalled();
      expect(this.view._fetchAllIcons).toHaveBeenCalled();
    });

    it('should be called when god triggers event and not refresh if the caller is itself', function () {
      spyOn(this.view, '_refreshCollection').and.callThrough();
      spyOn(this.view, 'render');
      spyOn(this.view, '_fetchAllIcons');
      this.view._initBinds();

      cdb.god.trigger('refreshCollection', { cid: this.view.cid });

      expect(this.view._refreshCollection).toHaveBeenCalled();
      expect(this.view.render).not.toHaveBeenCalled();
      expect(this.view._fetchAllIcons).not.toHaveBeenCalled();
    });
  });
});
