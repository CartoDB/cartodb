# encoding: utf-8
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
    @db = Rails::Sequel.connection
    Visualization.repository = DataRepository::Backend::Sequel.new(@db, :visualizations)

    member = Visualization::Member.new
    map_mock = mock
    map_mock.stubs(:scrollwheel=)
    map_mock.stubs(:legends=)
    map_mock.stubs(:legends)
    map_mock.stubs(:scrollwheel)
    map_mock.stubs(:id)
    map_mock.stubs(:save)
    Visualization::Member.any_instance.stubs(:map).returns(map_mock)
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
      user_mock = mock
      user_mock.stubs(:has_feature_flag?).with('disabled_cartodb_logo').returns(true)
      @visualization.stubs(:user).returns(user_mock)

      Visualization::Overlays.new(@visualization).create_default_overlays

      @visualization.overlays.select { |o| o.type == 'logo' }.count.should eq 0
      @visualization.overlays.count.should eq 4
    end
  end

  describe 'from_url' do
    it 'should create overlays from urls all true' do
      url_options = "title=true&description=true&search=true&shareable=true&cartodb_logo=true&layer_selector=true&legends=true&scrollwheel=true&fullscreen=true&sublayer_options=1%7C1%7C1&sql=&zoom=3&center_lat=15.961329081596686&center_lon=44.736328125"
      Visualization::Overlays.new(@visualization).create_overlays_from_url_options(url_options)

      @visualization.overlays.count.should eq 5
      @visualization.overlays.select { |o| o.options['display'] }.count.should eq 5
    end

    it 'should create overlays from urls header' do
      url_options = "title=false&description=true&search=true&shareable=true&cartodb_logo=true&layer_selector=true&legends=true&scrollwheel=true&fullscreen=true&sublayer_options=1%7C1%7C1&sql=&zoom=3&center_lat=15.961329081596686&center_lon=44.736328125"
      Visualization::Overlays.new(@visualization).create_overlays_from_url_options(url_options)

      @visualization.overlays.count.should eq 5
      @visualization.overlays.select { |o| o.options['display'] }.count.should eq 5

    end

    it 'should create overlays from urls header' do
      url_options = "title=false&description=true&search=true&shareable=false&cartodb_logo=false&layer_selector=true&legends=true&scrollwheel=true&fullscreen=true&sublayer_options=1%7C1%7C1&sql=&zoom=3&center_lat=15.961329081596686&center_lon=44.736328125"
      Visualization::Overlays.new(@visualization).create_overlays_from_url_options(url_options)

      @visualization.overlays.count.should eq 5
      @visualization.overlays.count { |o| o.options['display'] }.should eq 3

    end

    it 'should create default overlays for nil ' do
      Visualization::Overlays.new(@visualization).create_overlays_from_url_options(nil)
      @visualization.overlays.count.should eq 5
    end

    it 'should create default overlays for empty' do
      Visualization::Overlays.new(@visualization).create_overlays_from_url_options('')
      @visualization.overlays.count.should eq 5
    end


  end
end
