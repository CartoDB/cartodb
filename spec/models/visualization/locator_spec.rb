require 'spec_helper'
require_relative '../../../app/models/visualization/locator'
require_relative '../../../app/models/visualization'
require_relative '../../../app/models/visualization/member'
require_relative '../../doubles/support_tables.rb'

include CartoDB

describe Visualization::Locator do

  UUID = 'db0dfb0c-a944-11e3-a51e-30f9edfe5da6'

  before(:each) do
    support_tables_mock = Doubles::Visualization::SupportTables.new
    Visualization::Relator.any_instance.stubs(:support_tables).returns(support_tables_mock)
  end

  before do
    bypass_named_maps

    @db = SequelRails.connection
    Sequel.extension(:pagination)

    Visualization.repository  = DataRepository::Backend::Sequel.new(@db, :visualizations)

    @user_id = Carto::UUIDHelper.random_uuid

    @map_id = Carto::UUIDHelper.random_uuid

    # For relator->permission
    @user_mock = create_mocked_user
    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user_mock)

    @visualization  = Visualization::Member.new(
      {
      name:         'Visualization 1',
      description:  'A sample visualization',
      privacy:      'public',
      type:         'derived',
      map_id:       UUID,
      id:           @map_id,
      user_id:      @user_id
      }
    ).store

    user_fake     = model_fake(@map_id, @user_id)

    @subdomain    = 'bogus'
    @locator      = Visualization::Locator.new(user_fake)
  end

  describe '#get' do
    it 'fetches a Visualization::Member if passed an UUID' do
      rehydrated  = @locator.get(@visualization.id, @subdomain).first

      rehydrated.name.should == @visualization.name
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Visualization::Member if passed a visualization name' do
      Visualization::Collection.any_instance.stubs(:user_shared_vis).returns([])
      rehydrated  = @locator.get(@visualization.name, @subdomain).first

      rehydrated.id.should == @visualization.id
      rehydrated.description.should_not be_nil
    end

    it 'fetches a Table if passed a table id' do
      user = create_user(quota_in_bytes: 1234567890, table_quota: 10)
      user.stubs(:invalidate_varnish_cache).returns(nil)
      table = Table.new
      table.user_id = user.id
      table.save
      table.reload

      table_vis = table.table_visualization

      table = Visualization::Locator.new.get(table.id, user.username)
      table[1].nil?.should eq false
      table[1].id.should eq table_vis.table.id

      user.destroy
    end

    it 'returns nil if no visualization or table found' do
      Visualization::Collection.any_instance.stubs(:user_shared_vis).returns([])
      @locator.get('220d2f46-b371-11e4-93f7-080027880ca6', @subdomain).should == [nil, nil]
    end
  end #get

  def model_fake(map_id=nil, user_id=UUID)
    model_klass = Object.new

    class << model_klass
      attr_accessor :id
    end
    model_klass.id = user_id

    def model_klass.where(filter)
      @called_filter = filter
      [OpenStruct.new(
        maps: [OpenStruct.new(id: UUID)],
        id: id
       )]
    end

    def model_klass.called_filter
      @called_filter
    end
    model_klass
  end #model_fake
end # Visualization::Locator
