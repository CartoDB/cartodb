# encoding: utf-8
require 'rspec'
require 'sequel'

require_relative '../../../app/models/visualization/locator'
require_relative '../../../app/models/visualization'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::Locator do
  before do
    @db = Sequel.sqlite
    Sequel.extension(:pagination)

    Visualization::Migrator.new(@db).migrate
    Visualization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :visualizations)
    @visualization = Visualization::Member.new(
      name:         'Visualization 1',
      description:  'A sample visualization'
    ).store
  end

  describe '#find' do
    it 'fetches a Visualization::Member if passed an UUID' do
      locator     = Visualization::Locator.new
      rehydrated  = locator.find(@visualization.id)

      rehydrated.name.should == @visualization.name
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Visualization::Member if passed a visualizatio name' do
      locator     = Visualization::Locator.new
      rehydrated  = locator.find(@visualization.name)

      rehydrated.id.should == @visualization.id
      rehydrated.description.should_not be_nil
    end

    it 'returns nil if no Visualization::Member found' do
      locator     = Visualization::Locator.new
      locator.find('bogus').should be_nil
    end
  end #find
end # Visualization::Locator

