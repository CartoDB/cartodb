require 'spec_helper_unit'

describe Carto::Map do
  include Carto::Factories::Visualizations

  before do
    @user = create_user
    @carto_user = Carto::User.find(@user.id)
  end

  it "Tests layer ordering" do
    pending('TODO: flacky spec. Pending to fix.')
    table = ::Table.new
    table.user_id = @user.id
    table.save

    map = ::Map.create(user_id: @user.id, table_id: table.id)

    5.times do
      map.add_layer(create(:layer, kind: 'carto'))
    end

    3.times do
      map.add_layer(create(:layer, kind: 'tiled'))
    end

    map.add_layer(create(:layer, kind: 'torque'))

    layers_count = map.layers.count
    layers_count.should eq 9

    base_layers_count = map.base_layers.count
    base_layers_count.should eq 9

    carto_layers_count = map.carto_layers.count
    carto_layers_count.should eq 5

    user_layers_count = map.user_layers.count
    user_layers_count.should eq 3

    carto_and_torque_layers_count = map.data_layers.count
    carto_and_torque_layers_count.should eq 6

    torque_layers_count = map.torque_layers.count
    torque_layers_count.should eq 1

    other_layers_count = map.other_layers.count
    other_layers_count.should eq 1        # torque one counts as "other"

    map_new = Carto::Map.where(id: map.id).first

    layers_count.should eq map_new.layers.count
    base_layers_count.should eq map_new.base_layers.count
    carto_layers_count.should eq map_new.carto_layers.count
    user_layers_count.should eq map_new.user_layers.count
    carto_and_torque_layers_count.should eq map_new.data_layers.count
    torque_layers_count.should eq map_new.torque_layers.count
    other_layers_count.should eq map_new.other_layers.count

    map.layers.map(&:id).should eq map_new.layers.map(&:id)
    map.base_layers.map(&:id).should eq map_new.base_layers.map(&:id)
    map.data_layers.map(&:id).should eq map_new.data_layers.map(&:id)
    map.user_layers.map(&:id).should eq map_new.user_layers.map(&:id)
    map.data_layers.map(&:id).should eq map_new.data_layers.map(&:id)
    map.torque_layers.map(&:id).should eq map_new.torque_layers.map(&:id)
    map.other_layers.map(&:id).should eq map_new.other_layers.map(&:id)

    map.destroy
  end

  describe '#update_dataset_dependencies' do
    before do
      @carto_layer = create(:carto_layer, kind: 'carto')
      @torque_layer = create(:carto_layer, kind: 'torque')
      @map = Carto::Map.create(user: @carto_user, layers: [@carto_layer, @torque_layer])
    end

    it 'updates dependencies of carto layers' do
      @map.layers.select(&:carto?).first.expects(:register_table_dependencies).once
      @map.update_dataset_dependencies
    end

    it 'updates dependencies of carto layers' do
      @map.layers.select(&:torque?).first.expects(:register_table_dependencies).once
      @map.update_dataset_dependencies
    end
  end

  it '#save should trigger invalidation' do
    @map, @table, @table_visualization, @visualization = create_full_visualization(@carto_user)
    @visualization.send(:invalidation_service).expects(:invalidate)
    @map.save
  end
end
