require 'spec_helper_min'
require 'helpers/table_mock_helper'

describe CartoDB::TableRegistrar do
  include TableMockHelper

  before(:all) do
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    ::User[@user.id].destroy
  end

  describe '#register' do
    let(:description) { "Table registrar test description" }
    let(:source) { "Table registrar test source" }
    let(:attributions) { "Table registrar test attributions" }

    before(:each) do
      @data_import = FactoryGirl.create(:data_import, user_id: @user.id)

      @external_data_import = FactoryGirl.create(:external_data_import_with_external_source, data_import_id: @data_import.id)
      @external_data_import.external_source.visualization.description = description
      @external_data_import.external_source.visualization.source = source
      @external_data_import.external_source.visualization.attributions = attributions
      @external_data_import.external_source.visualization.save
    end

    after(:each) do
      @external_data_import.destroy

      @data_import.destroy
    end

    class TableFactory
    end

    it 'registers description from external sources' do
      TableFactory.stubs(:new).returns(table_mock)
      CartoDB::Visualization::Member.any_instance.stubs(:save_named_map).returns(true)

      tr = CartoDB::TableRegistrar.new(@user, TableFactory)
      tr.register('xxx', @external_data_import.data_import_id)

      tr.table.description.should eq description

      tr.table.table_visualization.delete
    end

    it 'creates a default visualization with external source description, attributions and source' do
      TableFactory.stubs(:new).returns(table_mock)
      CartoDB::Visualization::Member.any_instance.stubs(:save_named_map).returns(true)

      tr = CartoDB::TableRegistrar.new(@user, TableFactory)
      tr.register('xxx', @external_data_import.data_import_id)

      visualization = tr.table.table_visualization
      visualization.description.should eq @external_data_import.external_source.visualization.description
      visualization.source.should eq @external_data_import.external_source.visualization.source
      visualization.attributions.should eq @external_data_import.external_source.visualization.attributions

      visualization.delete
    end
  end
end
