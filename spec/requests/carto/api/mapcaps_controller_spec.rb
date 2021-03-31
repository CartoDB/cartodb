require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require_dependency 'carto/uuidhelper'

describe Carto::Api::MapcapsController do
  include Carto::Factories::Visualizations
  include HelperMethods

  let(:dummy_mapcap) do
    dummy = mock
    dummy.stubs(:id).returns(Carto::UUIDHelper.random_uuid)
    dummy
  end

  before(:all) do
    create(:feature_flag, name: 'editor-3', restricted: false)

    @user = create(:carto_user, builder_enabled: true)
    @intruder = create(:carto_user, builder_enabled: true)

    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  before(:each) { bypass_named_maps }

  after(:all) do
    Carto::FeatureFlag.destroy_all

    @torque_layer&.destroy
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)

    @user.destroy
    @intruder.destroy
  end

  def mapcap_should_be_correct(response)
    new_mapcap_id = response[:id]
    new_mapcap_id.should_not be_nil

    mapcap = Carto::Mapcap.find(new_mapcap_id)

    expected_response = JSON.parse(Carto::Api::MapcapPresenter.new(mapcap).to_poro.to_json).deep_symbolize_keys

    response.should eq expected_response
  end

  describe '#create' do
    after(:all) { Carto::Mapcap.all.each(&:destroy) }

    def create_mapcap_url(user: @user, visualization: @visualization)
      mapcaps_url(user_domain: user.subdomain, visualization_id: visualization.id, api_key: user.api_key)
    end

    it 'creates new mapcap' do
      post_json create_mapcap_url, {} do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response.body)
      end
    end

    it 'should only allow MAX_MAPCAPS_PER_VISUALIZATION mapcaps' do
      max_mapcaps = Carto::Visualization::MAX_MAPCAPS_PER_VISUALIZATION

      (max_mapcaps + 1).times do
        post_json create_mapcap_url, {} do |response|
          response.status.should eq 201

          mapcap_should_be_correct(response.body)
        end
      end

      mapcaps = Carto::Mapcap.where(visualization_id: @visualization.id)
      mapcaps.count == max_mapcaps
    end

    it 'returns 403 if user does not own the visualization' do
      post_json create_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end

    it 'triggers autoindex regeneration' do
      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::AutoIndexTable, @table.id).once
      post_json create_mapcap_url, {} do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response.body)
      end
    end

    it 'triggers autoindex regeneration for torque layers' do
      @map.data_layers.first.update_attribute(:kind, 'torque')
      ::Resque.expects(:enqueue).with(::Resque::UserDBJobs::UserDBMaintenance::AutoIndexTable, @table.id).once
      post_json create_mapcap_url, {} do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response.body)
      end
    end
  end

  describe '#index' do
    before(:all) do
      5.times { Carto::Mapcap.create(visualization_id: @visualization.id) }

      @mapcaps = Carto::Mapcap.all
    end

    after(:all) { @mapcaps.each(&:destroy) }

    def index_mapcap_url(user: @user, visualization: @visualization)
      mapcaps_url(
        user_domain: user.subdomain,
        visualization_id: visualization.id,
        api_key: user.api_key
      )
    end

    it 'indexes all mapcaps' do
      get_json index_mapcap_url, {} do |response|
        response.status.should eq 200

        response.body.each do |mapcap_representation|
          mapcap_should_be_correct(mapcap_representation.deep_symbolize_keys)
        end
      end
    end

    it 'returns 403 if user does not own the visualization' do
      get_json index_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#show' do
    before (:all) { @mapcap = Carto::Mapcap.create(visualization_id: @visualization.id) }
    after  (:all) { @mapcap.destroy }

    def show_mapcap_url(user: @user, visualization: @visualization, mapcap: @mapcap)
      mapcap_url(
        user_domain: user.subdomain,
        visualization_id: visualization.id,
        id: mapcap.id,
        api_key: user.api_key
      )
    end

    it 'shows a mapcap' do
      get_json show_mapcap_url, {} do |response|
        response.status.should eq 200

        mapcap_should_be_correct(response.body)
      end
    end

    it 'returns 404 for an inexistent mapcap' do
      get_json show_mapcap_url(mapcap: dummy_mapcap) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 403 if user does not own the visualization' do
      get_json show_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#destroy' do
    before (:each) { @mapcap = Carto::Mapcap.create(visualization_id: @visualization.id) }
    after  (:each) { @mapcap.destroy if @mapcap }

    def destroy_mapcap_url(user: @user, visualization: @visualization, mapcap: @mapcap)
      mapcap_url(
        user_domain: user.subdomain,
        visualization_id: visualization.id,
        id: mapcap.id,
        api_key: user.api_key
      )
    end

    it 'destroy a mapcap' do
      delete_json destroy_mapcap_url, {} do |response|
        response.status.should eq 204
        response.body.should be_empty

        Carto::Mapcap.exists?(response.body[:id]).should_not be_true
      end
    end

    it 'returns 404 for an inexistent mapcap' do
      delete_json destroy_mapcap_url(mapcap: dummy_mapcap) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 403 if user does not own the visualization' do
      delete_json destroy_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end
  end
end
