# encoding: utf-8
require 'ostruct'
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/copier'

include CartoDB

describe Visualization::Copier do
  before do
    Visualization.repository = DataRepository.new
    @user = OpenStruct.new(id: rand(999), maps: [])
  end

  describe '#initialize' do
    it 'requires a @user and a visualization' do
      lambda { Visualization::Copier.new }.should raise_error ArgumentError
    end
  end #initialize

  describe '#copy' do
    it 'returns a copy of the source visualization' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy
      copy.should be_an_instance_of Visualization::Member
    end

    it 'sets the same description as inthe original visualization' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy

      copy.description.should == visualization.description
    end

    it 'sets a derived type in the new visualization' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy

      copy.type.should == 'derived'
    end

    it 'copies the map from the original visualization' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy

      copy.map_id.should_not == visualization.map_id
    end

    it 'generates a name for the new visualization if none passed' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy

      copy.name.should_not be_nil
    end
  end #copy

  def factory
    OpenStruct.new(
      name:         'Visualization 0',
      description:  'bogus',
      map_id:       rand(999),
      type:         'table',
      map:          OpenStruct.new(
                      user_id: @user.id,
                      to_hash: { user_id: @user.id },
                      layers: []
                    )
    )
  end #factory
end # Visualization::Copier

