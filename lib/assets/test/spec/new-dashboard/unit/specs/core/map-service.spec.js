import mapService from 'new-dashboard/core/map-service';
import {
  visualizations as fakeVisualizations
} from '../fixtures/visualizations';
jest.mock('carto-node');

describe('mapService', () => {
  describe('.fetchMaps', () => {
    describe('when no parameters are given', () => {
      let response;
      beforeAll(done => {
        mapService.fetchMaps().then(data => {
          response = data;
          done();
        });
      });
      it('should return a list of visualizations filtered and ordered by default', () => {
        expect(response.visualizations).toEqual(fakeVisualizations);
      });
      it('should return metadata values', () => {
        expect(response.total_entries).toEqual(1);
        expect(response.total_likes).toEqual(1);
        expect(response.total_shared).toEqual(32);
        expect(response.total_user_entries).toEqual(6);
      });
    });
  });
});
