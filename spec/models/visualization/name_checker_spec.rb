# encoding: utf-8
require 'rspec'
require 'sequel'
require 'ostruct'
require_relative '../../../app/models/visualization/name_checker'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::NameChecker do
  before do
    @db   = Sequel.sqlite
    Visualization::Migrator.new(@db).migrate

    @user = OpenStruct.new(
      maps: [OpenStruct.new(id: 1), OpenStruct.new(id: 2)]
    )

    @db[:visualizations].insert(
      id:     '1',
      name:   'Visualization 1',
      map_id: 1
    )

    @db[:visualizations].insert(
      id:     '2',
      name:   'Visualization 2',
      map_id: 2
    )
  end

  describe '#available?' do
    it 'returns true if passed visualization name is available for the user' do
      checker = Visualization::NameChecker.new(@user, @db)
      checker.available?('Visualization 1').should == false
      checker.available?('Visualization 2').should == false
      checker.available?('Visualization 3').should == true
    end
  end #available?
end # Visualization::NameChecker

