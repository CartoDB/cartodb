require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/table_blender'

include CartoDB::Visualization

# TODO this file cannot be executed in isolation
describe TableBlender do
  let(:user) do
    create(:valid_user, private_tables_enabled: true, viewer: true)
  end

  let(:map_mock) do
    map = mock
    map.stubs(:to_hash).returns({})
    map.stubs(:user).returns(user)
    map.stubs(:user_layers).returns([])
    map.stubs(:data_layers).returns([])
    map
  end

  describe '#blend' do
    include Carto::Factories::Visualizations
    include_context 'users helper'

    it 'raises an error for viewer users' do
      tables = [fake_public_table, fake_private_table]
      expect {
        TableBlender.new(user, tables).blend
      }.to raise_error(/Viewer users can't blend tables/)
      user.destroy
    end

    describe 'multiple tables' do
      it 'sets increasing order for data layers and keep tiled first and last' do
        map1 = create(:carto_map_with_2_tiled_layers, user_id: @carto_user1.id)
        map2 = create(:carto_map_with_2_tiled_layers, user_id: @carto_user1.id)
        map1, table1, table_visualization1, visualization1 = create_full_visualization(@carto_user1, canonical_map: map1)
        map2, table2, table_visualization2, visualization2 = create_full_visualization(@carto_user1, canonical_map: map2)

        blender = CartoDB::Visualization::TableBlender.new(@carto_user1, [table1, table2])
        map = blender.blend

        map.layers.count.should eq 4
        orders_and_kind = map.layers.map { |l| [l.order, l.kind] }.sort { |x, y| x[0] <=> y[0] }
        orders_and_kind.should eq [[0, 'tiled'], [1, 'carto'], [2, 'carto'], [3, 'tiled']]

        destroy_full_visualization(map2, table2, table_visualization2, visualization2)
        destroy_full_visualization(map1, table1, table_visualization1, visualization1)
      end
    end

    describe 'default basemap' do
      before(:each) do
        @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user1)
      end

      after(:each) do
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      it 'is chosen from table map basemap for editor users' do
        @carto_user1.builder_enabled = false
        # Let's force a name change in order to be sure that it's taken from the table map and it's not a default one
        fake_name = 'fake_basemap_name'
        @table.map.user_layers.first.options['name'] = fake_name
        @table.save

        blender = CartoDB::Visualization::TableBlender.new(@carto_user1, [@table])

        map = blender.blend
        map.user_layers.first.options['name'].should eq fake_name
      end

      it 'is chosen from the default basemap for builder users' do
        @carto_user1.builder_enabled = true
        # Let's force a name change in order to be sure that it's not taken from the table map
        fake_name = 'fake_basemap_name'
        @table.map.user_layers.first.options['name'] = fake_name
        @table.save

        blender = CartoDB::Visualization::TableBlender.new(@carto_user1, [@table])

        map = blender.blend
        map.user_layers.first.options['name'].should_not eq fake_name
        map.user_layers.first.options['name'].should eq Cartodb.default_basemap['name']
      end
    end
  end

  # TODO test too coupled with implementation outside blender
  # refactor once Privacy is extracted
  describe '#blended_privacy' do
    it 'returns private if any of all tables is private' do
      user   = Object.new
      tables = [fake_public_table, fake_private_table]
      TableBlender.new(user, tables).blended_privacy.should == 'private'

      tables = [fake_private_table, fake_public_table]
      TableBlender.new(user, tables).blended_privacy.should == 'private'
    end

    it 'returns public if all tables are public' do
      user   = Object.new
      tables = [fake_public_table, fake_public_table]

      TableBlender.new(user, tables).blended_privacy.should == 'public'
    end
  end

  def fake_public_table
    table = mock
    table.stubs(:private?).returns(false)
    table.stubs(:public_with_link_only?).returns(false)
    table.stubs(:map).returns(map_mock)
    table
  end

  def fake_private_table
    table = mock
    table.stubs(:private?).returns(true)
    table.stubs(:public_with_link_only?).returns(false)
    table.stubs(:map).returns(map_mock)
    table
  end
end
