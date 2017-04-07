require 'spec_helper'

describe CartoDB::TableRegistrar do
  before(:all) do
    @user = create_user
  end

  after(:all) do
    @user.destroy
  end

  describe '#register' do
    let(:description) { "Table registrar test description" }
    let(:tags) { ["Administrative regions", "Historic"] }
    let(:source) { "Table registrar test source" }
    let(:attributions) { "Table registrar test attributions" }

    before(:each) do
      bypass_named_maps
      @data_import = FactoryGirl.create(:data_import, user_id: @user.id)

      @external_data_import = FactoryGirl.create(:external_data_import_with_external_source,
                                                 data_import_id: @data_import.id)
      @external_data_import.external_source.visualization.description = description
      @external_data_import.external_source.visualization.tags = tags
      @external_data_import.external_source.visualization.source = source
      @external_data_import.external_source.visualization.attributions = attributions
      @external_data_import.external_source.visualization.save
    end

    after(:each) do
      @external_data_import.destroy

      @data_import.destroy
    end

    it 'registers description from external sources' do
      CartoDB::Visualization::Member.any_instance.stubs(:save_named_map).returns(true)

      @user.in_database.run(%{CREATE TABLE xxx (id serial)})

      tr = CartoDB::TableRegistrar.new(@user, ::Table)
      tr.register('xxx', @external_data_import.data_import_id)

      tr.table.description.should eq description

      tr.table.table_visualization.delete

      tr.table.destroy
    end

    it 'registers tags from external sources' do
      CartoDB::Visualization::Member.any_instance.stubs(:save_named_map).returns(true)

      @user.in_database.run(%{CREATE TABLE xxx (id serial)})

      tr = CartoDB::TableRegistrar.new(@user, ::Table)
      tr.register('xxx', @external_data_import.data_import_id)

      tr.table.tags.should eq tags.join(',') # Tags are stored as a plain string

      tr.table.table_visualization.delete

      tr.table.destroy
    end

    it 'creates a default visualization with external source description, attributions and source' do
      CartoDB::Visualization::Member.any_instance.stubs(:save_named_map).returns(true)

      @user.in_database.run(%{CREATE TABLE xxx (id serial)})

      tr = CartoDB::TableRegistrar.new(@user, ::Table)
      tr.register('xxx', @external_data_import.data_import_id)

      visualization = tr.table.table_visualization
      visualization.description.should eq @external_data_import.external_source.visualization.description
      visualization.source.should eq @external_data_import.external_source.visualization.source
      visualization.attributions.should eq @external_data_import.external_source.visualization.attributions

      visualization.delete

      tr.table.destroy
    end
  end
end
