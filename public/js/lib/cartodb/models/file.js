

cdb.admin.File = Backbone.Model.extend({
    urlRoot: '/api/v1/upload'
});

cdb.admin.Files = Backbone.Collection.extend({
    url: '/api/v1/upload'
});

cdb.admin.Import = Backbone.Model.extend({
    idAttribute: 'item_queue_id',
    urlRoot: '/api/v1/imports'
});

cdb.admin.Imports = Backbone.Model.extend({
    url: '/api/v1/imports'
});
