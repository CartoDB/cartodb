var $ = require('jquery');
var createVis = require('../../../../src/api/create-vis');
var scenarios = require('./scenarios');

describe('create-vis-new', function () {
    beforeEach(function () {
        this.container = $('<div id="map">').css('height', '200px');
        this.containerId = this.container[0].id;
        $('body').append(this.container);
    });

    afterEach(function () {
        this.container.remove();
    });

    describe('CreateVis', function () {
        it('should set the right map center', function () {
            var visJson = scenarios.load(0);
            var vis = createVis(this.containerId, visJson);
            expect(vis.map.get('center')).toEqual(visJson.center);
        });
    })
});
