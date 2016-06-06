require 'spec_helper_min'

describe Carto::UserTableIndexService do
  include NamedMapsHelper
  include Carto::Factories::Visualizations

  before(:all) do
    byebug
    bypass_named_maps
    @user = FactoryGirl.create(:carto_user)
    @map1, @table1, @table_visualization1, @visualization1 = create_full_visualization(@user)
    @map2, @table2, @table_visualization2, @visualization2 = create_full_visualization(@user)

    @map12 = FactoryGirl.create(:carto_map, user_id: @user.id)
    FactoryGirl.create(:carto_tiled_layer, maps: [@map12])
    FactoryGirl.create(:carto_layer_with_sql, maps: [@map12], table_name: @table1.name)
    FactoryGirl.create(:carto_layer_with_sql, maps: [@map12], table_name: @table2.name)
    @map12.reload
    @visualization12 = FactoryGirl.create(:carto_visualization, user: @user, map: @map12)

    # Register table dependencies
    [@map1, @map2, @map12].each do |map|
      map.data_layers.each do |layer|
        ::Layer[layer.id].register_table_dependencies
      end
    end

    # Create analyses
    FactoryGirl.create(:source_analysis, visualization: @visualization1,
                                         user: @user, source_table: @table1.name)
    FactoryGirl.create(:analysis_with_source, visualization: @visualization2,
                                              user: @user, source_table: @table2.name)

    FactoryGirl.create(:source_analysis, visualization: @visualization12,
                                         user: @user, source_table: @table1.name)
    FactoryGirl.create(:source_analysis, visualization: @visualization12,
                                         user: @user, source_table: @table2.name)
  end

  after(:all) do
    @visualization12.destroy if @visualization12
    @map12.destroy if @map12
    destroy_full_visualization(@map2, @table2, @table_visualization2, @visualization2)
    destroy_full_visualization(@map1, @table1, @table_visualization1, @visualization1)
    # This avoids connection leaking.
    ::User[@user.id].destroy
  end

  after(:each) do
    Carto::Widget.all.map(&:destroy)
  end

  it 'retrieves all visualizations of the user table' do
    viz = Carto::UserTableIndexService.new(@table1).send(:visualizations)
    viz.sort.should eq [@visualization1, @visualization12].sort
  end
end
