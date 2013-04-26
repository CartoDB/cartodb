# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/map/copier'
require_relative '../../../app/models/layer'

describe CartoDB::Map::Copier do
  before do
    @user   = create_user
    @map    = OpenStruct.new(
                user_id: @user.id,
                to_hash: { user_id: @user.id },
                layers:  (1..5).map { Layer.new(kind: 'carto') }
              )
    @copier = CartoDB::Map::Copier.new(@map, @user)
  end

  describe '#copy' do
    it 'returns a copy of the original map' do
      new_map = @copier.copy
      new_map.should be_an_instance_of Map
      new_map.user_id.should == @user.id
    end

    it 'copies all layers from the original map' do
      new_map = @copier.copy
      new_map.layers.length.should == @map.layers.length
    end
  end #copy
end # CartoDB::Map::Copier

