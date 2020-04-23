require_relative '../../spec_helper'
require_relative '../../../app/models/map/copier'
require_relative '../../../app/models/layer'

describe CartoDB::Map::Copier do
  before do
    @user_id  = Carto::UUIDHelper.random_uuid
    @map      = Map.new(user_id: @user_id)
    @map.stubs(:layers).returns((1..5).map { Layer.new(kind: 'carto') })
    @copier = CartoDB::Map::Copier.new
  end

  describe '#copy' do
    it 'returns a copy of the original map' do
      new_map = @copier.copy(@map)
      new_map.should be_an_instance_of Map
      new_map.user_id.should == @user_id
    end

    it 'copies all layers from the original map' do
      new_map = @copier.copy(@map)
      new_map.layers.length.should == 5
    end
  end #copy
end # CartoDB::Map::Copier
