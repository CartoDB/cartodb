require 'json'
require_relative '../../spec_helper'

describe Carto::BiVisualization do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      bi_visualization = FactoryGirl.create(:bi_visualization)
      loaded_bi_visualization = Carto::BiVisualization.find(bi_visualization.id)
      loaded_bi_visualization.id.should == bi_visualization.id
      loaded_bi_visualization.viz_json.should == bi_visualization.viz_json
      loaded_bi_visualization.viz_json_json.should == JSON.parse(bi_visualization.viz_json).symbolize_keys
      loaded_bi_visualization.bi_dataset.should == bi_visualization.bi_dataset
    end
  end
end
