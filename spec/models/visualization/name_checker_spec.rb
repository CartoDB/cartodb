# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require 'sequel'
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/name_checker'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::NameChecker do
  before :all do
    bypass_named_maps
    @user = FactoryGirl.create(:valid_user)
    @user2 = FactoryGirl.create(:valid_user)

    @vis1 = FactoryGirl.build(:derived_visualization, name: 'Visualization 1', user_id: @user.id).store
    @vis2 = FactoryGirl.build(:derived_visualization, name: 'Visualization 2', user_id: @user.id).store
    @vis3 = FactoryGirl.build(:derived_visualization, name: 'Visualization 4', user_id: @user2.id).store

    @shared_entity = CartoDB::SharedEntity.new(
      recipient_id:   @user.id,
      recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id:      @vis3.id,
      entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
    ).save
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
