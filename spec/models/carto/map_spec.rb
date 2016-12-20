# coding: UTF-8
require_relative '../../spec_helper'

describe Carto::Map do
  before(:all) do
    @user = create_user
  end

  before(:each) do
    bypass_named_maps
    delete_user_data(@user)
  end

  after(:all) do
    bypass_named_maps
    @user.destroy
  end

  it "Tests layer ordering" do
    table = ::Table.new
    table.user_id = @user.id
    table.save

    map = ::Map.create(user_id: @user.id, table_id: table.id)

    5.times do
      map.add_layer(::Layer.create(kind: 'carto'))
    end

    3.times do
      map.add_layer(Layer.create(kind: 'tiled'))
    end

    map.add_layer(Layer.create(kind: 'torque'))

    layers_count = map.layers.count
    layers_count.should eq 9

    base_layers_count = map.base_layers.count
    base_layers_count.should eq 9

    data_layers_count = map.data_layers.count
    data_layers_count.should eq 5

    user_layers_count = map.user_layers.count
    user_layers_count.should eq 3

    carto_and_torque_layers_count = map.carto_and_torque_layers.count
    carto_and_torque_layers_count.should eq 6

    torque_layers_count = map.torque_layers.count
    torque_layers_count.should eq 1

    other_layers_count = map.other_layers.count
    other_layers_count.should eq 1        # torque one counts as "other"

    map_new = Carto::Map.where(id: map.id).first

    layers_count.should eq map_new.layers.count
    base_layers_count.should eq map_new.base_layers.count
    data_layers_count.should eq map_new.data_layers.count
    user_layers_count.should eq map_new.user_layers.count
    carto_and_torque_layers_count.should eq map_new.carto_and_torque_layers.count
    torque_layers_count.should eq map_new.torque_layers.count
    other_layers_count.should eq map_new.other_layers.count

    map.layers.map(&:id).should eq map_new.layers.map(&:id)
    map.base_layers.map(&:id).should eq map_new.base_layers.map(&:id)
    map.data_layers.map(&:id).should eq map_new.data_layers.map(&:id)
    map.user_layers.map(&:id).should eq map_new.user_layers.map(&:id)
    map.carto_and_torque_layers.map(&:id).should eq map_new.carto_and_torque_layers.map(&:id)
    map.torque_layers.map(&:id).should eq map_new.torque_layers.map(&:id)
    map.other_layers.map(&:id).should eq map_new.other_layers.map(&:id)

    map.destroy
  end

end
