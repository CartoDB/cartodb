require 'spec/spec_helper_min'

describe Carto::Api::VisualizationExportPresenter do
  describe 'url generation' do
    it 'us'
    url = 'http://cartodb.com/uploads/whatever'
    export = FactoryGirl.build(:visualization_export, url: url)
    poro = Carto::Api::VisualizationExportPresenter.new(export).to_poro
    poro[:url].should eq url
  end
end
