# encoding: utf-8
require 'rspec'
require 'sequel'

require_relative '../../spec_helper'
require_relative '../../../app/models/visualization/locator'
require_relative '../../../app/models/visualization'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/migrator'

include CartoDB

describe Visualization::Locator do

  UUID = 'db0dfb0c-a944-11e3-a51e-30f9edfe5da6'

  before do
    # Using Mocha stubs until we update RSpec (@see http://gofreerange.com/mocha/docs/Mocha/ClassMethods.html)
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get).returns(nil)

    @db = Sequel.sqlite
    Sequel.extension(:pagination)

    Visualization::Migrator.new(@db).migrate
    Visualization.repository  = 
      DataRepository::Backend::Sequel.new(@db, :visualizations)

    @map_id         = UUIDTools::UUID.timestamp_create.to_s
    @visualization  = Visualization::Member.new(
      name:         'Visualization 1',
      description:  'A sample visualization',
      privacy:      'public',
      type:         'derived',
      map_id:       UUID,
      id:           @map_id
    ).store

    table_fake    = model_fake
    user_fake     = model_fake(@map_id)

    @subdomain    = 'bogus'
    @locator      = Visualization::Locator.new(table_fake, user_fake)
  end

  describe '#get' do
    it 'fetches a Visualization::Member if passed an UUID' do
      rehydrated  = @locator.get(@visualization.id, @subdomain).first

      rehydrated.name.should == @visualization.name
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Visualization::Member if passed a visualization name' do
      rehydrated  = @locator.get(@visualization.name, @subdomain).first

      rehydrated.id.should == @visualization.id
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Table if passed a table id' do
      table_fake, user_fake = model_fake, model_fake(@map_id)
      locator = Visualization::Locator.new(table_fake, user_fake)
      locator.get(0, @subdomain)
      table_fake.called_filter.should == { id: 0, user_id: nil }
    end

    it 'returns nil if no visualization or table found' do
      @locator.get('bogus', @subdomain).should == [nil, nil]
    end
  end #get

  def model_fake(map_id=nil)
    model_klass = Object.new
    def model_klass.where(filter)
      @called_filter = filter
      [OpenStruct.new(maps: [OpenStruct.new(id: UUID)])]
    end

    def model_klass.called_filter; @called_filter; end
    model_klass
  end #model_fake
end # Visualization::Locator

