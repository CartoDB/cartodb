var createContextMenu = require('builder/dataset/dataset-header/create-context-menu');

describe('dataset/create-context-menu', function () {
  it('should provide all options when user is owner', function () {
    var view = createContextMenu({
      ev: {},
      isTableOwner: true,
      isSync: false,
      isCustomQuery: false,
      triggerElementID: '--'
    });
    view.render();

    expect(view.$('.js-listItem').length).toBe(5);
    expect(view.$('.js-listItem[data-val="delete"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="rename"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="metadata"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="lock"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="duplicate"]').length).toBe(1);

    view.clean();
  });

  it('should not provide any option except duplicate', function () {
    var view = createContextMenu({
      ev: {},
      isTableOwner: false,
      isSync: false,
      isCustomQuery: false,
      triggerElementID: '--'
    });
    view.render();

    expect(view.$('.js-listItem').length).toBe(1);
    expect(view.$('.js-listItem[data-val="delete"]').length).toBe(0);
    expect(view.$('.js-listItem[data-val="rename"]').length).toBe(0);
    expect(view.$('.js-listItem[data-val="lock"]').length).toBe(0);
    expect(view.$('.js-listItem[data-val="metadat"]').length).toBe(0);
    expect(view.$('.js-listItem[data-val="duplicate"]').length).toBe(1);

    view.clean();
  });

  it('should not provide rename option if is synced', function () {
    var view = createContextMenu({
      ev: {},
      isTableOwner: true,
      isSync: true,
      isCustomQuery: false,
      triggerElementID: '--'
    });
    view.render();

    expect(view.$('.js-listItem').length).toBe(4);
    expect(view.$('.js-listItem[data-val="delete"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="rename"]').length).toBe(0);
    expect(view.$('.js-listItem[data-val="metadata"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="lock"]').length).toBe(1);
    expect(view.$('.js-listItem[data-val="duplicate"]').length).toBe(1);

    view.clean();
  });
});
