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
  before do
    @db = Rails::Sequel.connection
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

    @user = OpenStruct.new(
      maps: [OpenStruct.new(id: 'c21ff32c-45c2-4300-a49b-786d35524d52'),
             OpenStruct.new(id: 'c21ff32c-45c2-4300-a49b-786d35524d57')]
    )

    @db[:visualizations].insert(
      id:         'd21ff32c-45c2-4300-a49b-786d35524d52',
      name:       'Visualization 1',
      privacy:    'public',
      created_at: Time.now,
      updated_at: Time.now,
      map_id:     'c21ff32c-45c2-4300-a49b-786d35524d52'
    )

    @db[:visualizations].insert(
      id:         'd21ff32c-45c2-4300-a49b-786d35524d57',
      name:       'Visualization 2',
      privacy:    'public',
      created_at: Time.now,
      updated_at: Time.now,
      map_id:     'c21ff32c-45c2-4300-a49b-786d35524d57'
    )
  end

  after do
    @user.destroy
  end

  describe '#available?' do
    it 'returns true if passed visualization name is available for the user' do
      checker = Visualization::NameChecker.new(@user)
      checker.available?('Visualization 1').should == false
      checker.available?('Visualization 2').should == false
      checker.available?('Visualization 3').should == true
    end
  end #available?
end # Visualization::NameChecker

