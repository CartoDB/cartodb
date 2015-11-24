require 'json'
require_relative '../../spec_helper'

describe Carto::BiDataset do
  describe 'Storage' do
    it 'can be stored and retrieved keeping the data' do
      bi_dataset = FactoryGirl.create(:bi_dataset)
      loaded_bi_dataset = Carto::BiDataset.find(bi_dataset.id)
      loaded_bi_dataset.id.should == bi_dataset.id
      loaded_bi_dataset.state.should == bi_dataset.state
      loaded_bi_dataset.import_config.should == bi_dataset.import_config
      loaded_bi_dataset.import_config_json.should == JSON.parse(bi_dataset.import_config).symbolize_keys
      loaded_bi_dataset.user_id.should == bi_dataset.user_id
      loaded_bi_dataset.import_source.should == bi_dataset.import_source
      loaded_bi_dataset.import_credentials.should == bi_dataset.import_credentials
      loaded_bi_dataset.import_credentials_json.should == JSON.parse(bi_dataset.import_credentials).symbolize_keys
    end
  end
end
