# encoding: utf-8
require 'ostruct'
require 'sequel'
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/copier'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::Copier do
  before do
    @db = Rails::Sequel.connection
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

    @user = create_user
  end

  describe '#initialize' do
    it 'requires a @user and a visualization' do
      lambda {
        Visualization::Copier.new
      }.should raise_error ArgumentError
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

    it 'copies overlays' do
      visualization = factory
      copy          = Visualization::Copier.new(@user, visualization).copy

      copy.overlays.zip(visualization.overlays).each do |overlay_copy, overlay_original|
        overlay_copy.id.should               neq overlay_original.id
        overlay_copy.visualization_id.should eq  copy.id
        overlay_copy.type.should             eq  overlay_original.type
        overlay_copy.template.should         eq  overlay_original.template
        overlay_copy.options.should          eq  overlay_original.options
        overlay_copy.order.should            eq  overlay_original.order
      end
    end
  end #copy

  def factory
    OpenStruct.new(
      name:         'Visualization 0',
      description:  'bogus',
      map_id:       rand(999),
      type:         'table',
      overlays:     [],
      map:          OpenStruct.new(
                      user_id: @user.id,
                      to_hash: { user_id: @user.id },
                      layers: []
                    )
    )
  end #factory

  after do
    @user.destroy
  end
end # Visualization::Copier
