import { updateVisualization } from 'new-dashboard/store/actions/visualizations';
import { testAction } from '../helpers';

describe('store/actions/visualizations', () => {
  it('updateVisualization', done => {
    const payload = {
      visualizationId: 'fake_id',
      visualizationAttributes: {
        liked: false
      }
    };

    const expectedMutations = [
      { type: 'maps/updateVisualization', payload },
      { type: 'datasets/updateVisualization', payload },
      { type: 'recentContent/updateVisualization', payload },
      { type: 'search/updateVisualization', payload }
    ];

    testAction({ action: updateVisualization, payload, expectedMutations, done });
  });
});
