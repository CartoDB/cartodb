# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../app/models/map/copier'

describe CartoDB::Map::Copier do
  before do
    @user   = OpenStruct.new(id: rand(999))
    @map    = OpenStruct.new(user_id: @user.id, layers: factory_layers)
    @copier = CartoDB::Map::Copier.new(@map, @user)

    def @map.to_hash; { user_id: self.user_id, layers: self.layers }; end
    def @map.layers=(*args); end
  end

  describe '#copy' do
    it 'returns a copy of the original map' do
      new_map = @copier.copy
      new_map.should be_an_instance_of Map
      new_map.user.should == @user
    end

    it 'copies all layers from the original map' do
      new_map = @copier.copy
      new_map.layers.length.should == map.layers.length
    end
  end #copy

  def factory_layers
    (1..5).map { OpenStruct.new(maps: [], user: []) }
  end #factory_layers
end # CartoDB::Map::Copier

