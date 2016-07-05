require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require_dependency 'carto/uuidhelper'

describe Carto::Api::MapcapsController do
  include Carto::Factories::Visualizations
  include HelperMethods

  let(:dummy_mapcap) do
    dummy = mock
    dummy.stubs(:id).returns(UUIDTools::UUID.random_create.to_s)
    dummy
  end

  let(:state_json) do
    {
      "map" => {
        "center" => [27.68352808378776, -86.30859375],
        "zoom" => 6
      },
      "widgets" => {
        "8607099f-3740-4b56-bb9d-369aa52ada53" => {
          "acceptedCategories" => ["Masonry"]
        }
      }
    }
  end

  before(:all) do
    FactoryGirl.create(:carto_feature_flag, name: 'editor-3', restricted: false)

    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)

    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
  end

  before(:each) { bypass_named_maps }

  after(:all) do
    Carto::FeatureFlag.destroy_all

    destroy_full_visualization(@map, @table, @table_visualization, @visualization)

    @user.destroy
    @intruder.destroy
  end

  def mapcap_should_be_correct(response)
    response_body = response.body

    new_mapcap_id = response_body[:id]
    new_mapcap_id.should_not be_nil

    mapcap = Carto::Mapcap.find(new_mapcap_id)

    expected_response = JSON.load(Carto::Api::MapcapPresenter.new(mapcap).to_poro.to_json).deep_symbolize_keys

    response_body.should eq expected_response
  end

  describe '#create' do
    after(:all) { Carto::Mapcap.all.each(&:destroy) }

    def create_mapcap_url(user: @user, visualization: @visualization)
      mapcaps_url(user_domain: user.subdomain, visualization_id: visualization.id, api_key: user.api_key)
    end

    it 'creates new mapcap with state' do
      post_json create_mapcap_url, state_json: state_json do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response)
      end
    end

    it 'creates new mapcap without state' do
      post_json create_mapcap_url, {} do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response)
      end
    end

    it 'should only allow MAX_MAPCAPS_PER_MAP mapcaps' do
      max_mapcaps_per_map = Carto::Api::MapcapsController::MAX_MAPCAPS_PER_MAP

      (max_mapcaps_per_map + 1).times do
        post_json create_mapcap_url, state_json: state_json do |response|
          response.status.should eq 201

          mapcap_should_be_correct(response)
        end
      end

      Carto::Mapcap.where(visualization_id: @visualization.id).count == max_mapcaps_per_map
    end

    it 'returns 403 if user does not own the visualization' do
      post_json create_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#index' do
    before(:all) do
      5.times { Carto::Mapcap.create(visualization_id: @visualization.id, state_json: state_json) }

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
      get index_mapcap_url, {} do |response|
        response.status.should eq 200

        response.body.each do |mapcap_representation|
          mapcap_should_be_correct(mapcap_representation)
        end
      end
    end

    it 'returns 403 if user does not own the visualization' do
      get index_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403

        response.body.should be_empty
      end
    end
  end

  describe '#show' do
    before (:all) { @mapcap = Carto::Mapcap.create(visualization_id: @visualization.id, state_json: state_json) }
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
      get show_mapcap_url, {} do |response|
        response.status.should eq 200

        mapcap_should_be_correct(response)
      end
    end

    it 'returns 404 for an inexistent mapcap' do
      get show_mapcap_url(mapcap: dummy_mapcap) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 403 if user does not own the visualization' do
      get show_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403

        response.body.should be_empty
      end
    end
  end

  describe '#destroy' do
    before (:each) { @mapcap = Carto::Mapcap.create(visualization_id: @visualization.id, state_json: state_json) }
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
      get destroy_mapcap_url, {} do |response|
        response.status.should eq 204
        response.body.should be_empty

        Carto::Mapcap.exists?(response.body[:id]).should_not be_true
      end
    end

    it 'returns 404 for an inexistent mapcap' do
      get destroy_mapcap_url(mapcap: dummy_mapcap) do |response|
        response.status.should eq 404
      end
    end

    it 'returns 403 if user does not own the visualization' do
      get destroy_mapcap_url(user: @intruder), {} do |response|
        response.status.should eq 403

        response.body.should be_empty
      end
    end
  end
end
