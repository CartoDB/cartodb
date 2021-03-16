require 'spec_helper'
require_relative '../../../app/models/visualization/name_checker'

include CartoDB

describe Visualization::NameChecker do
  before :all do
    bypass_named_maps
    @user = create(:valid_user)
    @user2 = create(:valid_user)

    @vis1 = build(:derived_visualization, name: 'Visualization 1', user_id: @user.id).store
    @vis2 = build(:derived_visualization, name: 'Visualization 2', user_id: @user.id).store
    @vis3 = build(:derived_visualization, name: 'Visualization 4', user_id: @user2.id).store

    @shared_entity = Carto::SharedEntity.create(
      recipient_id: @user.id,
      recipient_type: Carto::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id: @vis3.id,
      entity_type: Carto::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )
  end

  after :all do
    @shared_entity.destroy
    @vis3.destroy
    @vis2.destroy
    @vis1.destroy
    @user.destroy
  end

  describe '#available?' do
    it 'returns true if passed visualization name is available for the user' do
      checker = Visualization::NameChecker.new(@user)
      checker.available?('Visualization 3').should == true
    end

    it 'returns false if passed visualization name is in use by the user' do
      checker = Visualization::NameChecker.new(@user)
      checker.available?('Visualization 1').should == false
      checker.available?('Visualization 2').should == false
    end

    it 'returns true if name is available but used in shared visualizations' do
      checker = Visualization::NameChecker.new(@user)
      checker.available?('Visualization 4').should == true
    end
  end # available?
end # Visualization::NameChecker
