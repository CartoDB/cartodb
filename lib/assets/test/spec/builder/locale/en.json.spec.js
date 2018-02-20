var en = require('locale/en.json');

describe('en.json', function () {
  describe('edit-feature', function () {
    it('assert that the texts are the expected ones', function () {
      var texts = en.editor['edit-feature'];
      expect(texts.disabled).toEqual('Feature editing is disabled for %{disabledLayerType}. To edit data, export this layer and import it as a new layer.');
    });
  });
});
