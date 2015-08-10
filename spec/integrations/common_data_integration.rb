# coding: UTF-8
require_relative '../spec_helper'

describe CommonData do
  before(:each) do
    @common_data = CommonData.new
    stub_named_maps_calls
  end

  after(:all) do
    Typhoeus::Expectation.clear
  end

  it 'should import correctly Common Data datasets' do
    datasets = @common_data.datasets[:datasets]

    user = create_user(
      :quota_in_bytes => 1000000000, 
      :table_quota => 10000, 
      :private_tables_enabled => true
      )
    
    datasets.each do |dataset|
      data_import = DataImport.create(
        :user_id => user.id,
        :data_source => dataset["url"]
        )
      
      data_import.run_import!
      data_import.success.should(eq(true), "Dataset '#{dataset['name']}' failed to be imported")
    end   

    user.destroy 
  end
end