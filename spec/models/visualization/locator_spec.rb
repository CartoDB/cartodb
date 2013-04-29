# encoding: utf-8
require 'rspec'
require 'sequel'

require_relative '../../../app/models/visualization/locator'
require_relative '../../../app/models/visualization'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/migrator'

describe CartoDB::Visualization::Locator do
  before do
    @db = Sequel.sqlite
    Sequel.extension(:pagination)

    CartoDB::Visualization::Migrator.new(@db).migrate
    CartoDB::Visualization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :visualizations)
    @visualization  = CartoDB::Visualization::Member.new(
      name:         'Visualization 1',
      description:  'A sample visualization'
    ).store
    @locator        = CartoDB::Visualization::Locator.new(table_fake)
  end

  describe '#get' do
    it 'fetches a Visualization::Member if passed an UUID' do
      rehydrated  = @locator.get(@visualization.id).first

      rehydrated.name.should == @visualization.name
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Visualization::Member if passed a visualizatio name' do
      rehydrated  = @locator.get(@visualization.name).first

      rehydrated.id.should == @visualization.id
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Table if passed a table id' do
      table_fake  = stub('find_by_subdomain')
      locator     = CartoDB::Visualization::Locator.new(table_fake)

      table_fake.should_receive(:find_by_subdomain).with('foo', 0)
      locator.get(0, 'foo')
    end

    it 'returns nil if no visualization or table found' do
      @locator.get('bogus').should == false
    end
  end #get

  def table_fake
    table_klass = Object.new
    def table_klass.find_by_subdomain(subdomain, identifier)
      OpenStruct.new
    end
    table_klass
  end #table_fake
end # CartoDB::Visualization::Locator

