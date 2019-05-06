import { updateVisualization } from 'new-dashboard/store/mutations/visualizations';

describe('store/actions/visualizations', () => {
  it('updateVisualization', () => {
    const state = {
      list: {
        visualization_id: {}
      }
    };

    const payload = {
      visualizationId: 'visualization_id',
      visualizationAttributes: {
        liked: false
      }
    };

    updateVisualization(state, payload);

    expect(state).toEqual({
      list: {
        visualization_id: {
          liked: false
        }
      }
    });
  });
});
