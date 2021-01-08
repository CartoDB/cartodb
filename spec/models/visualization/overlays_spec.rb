require 'ostruct'
require 'sequel'

require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/member'
require_relative '../../../app/models/visualization/overlays'
require_relative '../../../services/data-repository/repository'

include CartoDB

describe Visualization::Overlays do

  before(:each) do
    @db = SequelRails.connection
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

    member = Visualization::Member.new
    map_mock = double
    allow(map_mock).to receive(:scrollwheel=)
    allow(map_mock).to receive(:legends=)
    allow(map_mock).to receive(:legends)
    allow(map_mock).to receive(:scrollwheel)
    allow(map_mock).to receive(:id)
    allow(map_mock).to receive(:save)
    allow_any_instance_of(Visualization::Member).to receive(:map).and_return(map_mock)
    @visualization = member

    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
  end

  describe 'default' do
    it 'should create all overlays' do
      Visualization::Overlays.new(@visualization).create_default_overlays

      @visualization.overlays.count.should eq 5
      @visualization.overlays.select { |o| o.options['display'] }.count.should eq 5
      @visualization.overlays.select { |o| o.type == 'logo' }.count.should eq 1
    end

    it 'should not create logo if user has disabled_cartodb_logo feature_flag' do
      user_mock = double
      allow(user_mock).to receive(:has_feature_flag?).with('disabled_cartodb_logo').and_return(true)
      allow(@visualization).to receive(:user).and_return(user_mock)

      Visualization::Overlays.new(@visualization).create_default_overlays

      @visualization.overlays.select { |o| o.type == 'logo' }.count.should eq 0
      @visualization.overlays.count.should eq 4
    end
  end
end
