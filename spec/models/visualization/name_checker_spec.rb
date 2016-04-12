# encoding: utf-8
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require 'sequel'
require 'ostruct'
require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/name_checker'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::NameChecker do
  before :all do
    @db = Rails::Sequel.connection
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

    @permission1 = CartoDB::Permission.new(owner_id: 'b21ff32c-45c2-4300-a49b-786d35524d52', owner_username: 'user').save
    @permission2 = CartoDB::Permission.new(owner_id: 'b21ff32c-45c2-4300-a49b-786d35524d52', owner_username: 'user').save
    @permission3 = CartoDB::Permission.new(owner_id: 'b21ff32c-45c2-4300-a49b-786d35524d52', owner_username: 'user').save

    @user = OpenStruct.new(
      id:   'b21ff32c-45c2-4300-a49b-786d35524d52',
      maps: [OpenStruct.new(id: 'c21ff32c-45c2-4300-a49b-786d35524d52'),
             OpenStruct.new(id: 'c21ff32c-45c2-4300-a49b-786d35524d57')]
    )

    @db[:visualizations].insert(
      id:            'd21ff32c-45c2-4300-a49b-786d35524d52',
      name:          'Visualization 1',
      privacy:       'public',
      created_at:    Time.now,
      updated_at:    Time.now,
      map_id:        'c21ff32c-45c2-4300-a49b-786d35524d52',
      user_id:       'b21ff32c-45c2-4300-a49b-786d35524d52',
      permission_id: @permission1.id
    )

    @db[:visualizations].insert(
      id:            'd21ff32c-45c2-4300-a49b-786d35524d57',
      name:          'Visualization 2',
      privacy:       'public',
      created_at:    Time.now,
      updated_at:    Time.now,
      map_id:        'c21ff32c-45c2-4300-a49b-786d35524d57',
      user_id:       'b21ff32c-45c2-4300-a49b-786d35524d52',
      permission_id: @permission2.id
    )

    @db[:visualizations].insert(
      id:            'd21ff32c-45c2-4300-a49b-786d35524d59',
      name:          'Visualization 4',
      privacy:       'public',
      created_at:    Time.now,
      updated_at:    Time.now,
      map_id:        'c21ff32c-45c2-4300-a49b-786d35524d57',
      user_id:       'b21ff32c-45c2-4300-a49b-786d35524d46',
      permission_id: @permission3.id
    )

    @db[:shared_entities].insert(
      entity_type:    'vis',
      entity_id:      'd21ff32c-45c2-4300-a49b-786d35524d59',
      recipient_type: 'user',
      recipient_id:   'b21ff32c-45c2-4300-a49b-786d35524d52'
    )
  end

  after :all do
    @permission1.destroy
    @permission2.destroy
    @permission3.destroy
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
