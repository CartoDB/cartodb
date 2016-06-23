require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require_dependency 'carto/uuidhelper'

describe Carto::Api::AnalysesController do
  include Carto::Factories::Visualizations
  include HelperMethods

  before(:all) do
    FactoryGirl.create(:carto_feature_flag, name: 'editor-3', restricted: false)

    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)

    _, _, _, @visualization = create_full_visualization(@user)
  end

  before(:each) { bypass_named_maps }

  after(:all) do
    Carto::FeatureFlag.destroy_all

    @visualization.destroy

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

    it 'creates new mapcap' do
      post_json create_mapcap_url, {} do |response|
        response.status.should eq 201

        mapcap_should_be_correct(response)
      end
    end

    it 'returns 403 if user does not own the visualization' do
      post_json create_mapcap_url(user: @intruder), {} do |response|
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
      get show_mapcap_url, {} do |response|
        response.status.should eq 200

        mapcap_should_be_correct(response)
      end
    end

    it 'returns 404 for an inexistent mapcap' do
      get show_mapcap_url, mapcap: Carto::Mapcap.new do |response|
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

  # describe '#show' do
  #   it 'returns 403 if user does not own the visualization' do
  #     get_json mapcap(@user2, @visualization, @analysis.id) do |response|
  #       response.status.should eq 403
  #     end
  #   end

  #   def verify_analysis_response_body(response_body, analysis)
  #     response_body[:id].should eq analysis.id
  #     analysis_definition = response_body[:analysis_definition]
  #     analysis_definition.deep_symbolize_keys.should eq analysis.analysis_definition.deep_symbolize_keys
  #     analysis_definition[:id].should eq analysis.natural_id
  #   end

  #   it 'returns existing analysis by uuid' do
  #     get_json viz_analysis_url(@user, @visualization, @analysis.id) do |response|
  #       response.status.should eq 200
  #       verify_analysis_response_body(response[:body], @analysis)
  #     end
  #   end

  #   it 'returns 404 for nonexisting analysis' do
  #     get_json viz_analysis_url(@user, @visualization, 'wadus') do |response|
  #       response.status.should eq 404
  #     end
  #   end

  #   it 'returns existing analysis by json first id' do
  #     get_json viz_analysis_url(@user, @visualization, @analysis.natural_id) do |response|
  #       response.status.should eq 200
  #       verify_analysis_response_body(response[:body], @analysis)
  #     end
  #   end

  #   it 'returns existing analysis by json first id with uuid ids' do
  #     bypass_named_maps
  #     analysis2 = FactoryGirl.create(
  #       :source_analysis,
  #       visualization_id: @visualization.id,
  #       user_id: @user.id,
  #       analysis_definition: { id: UUIDTools::UUID.random_create.to_s }
  #     )

  #     get_json viz_analysis_url(@user, @visualization, analysis2.natural_id) do |response|
  #       response.status.should eq 200
  #       verify_analysis_response_body(response[:body], analysis2)
  #     end

  #     analysis2.destroy
  #   end
  # end


  # describe '#update' do
  #   let(:new_natural_id) { "#{natural_id}_2" }

  #   let(:new_key) { :whatever }

  #   let(:new_payload) do
  #     payload.delete(:id)
  #     payload.merge(whatever: 'really?')
  #     payload[:analysis_definition][:id] = new_natural_id
  #     payload[:analysis_definition][new_key] = 'really'
  #     payload
  #   end

  #   it 'updates existing analysis' do
  #     @analysis.reload
  #     @analysis.analysis_definition[:id].should_not eq new_payload[:analysis_definition][:id]
  #     @analysis.analysis_definition[new_key].should be_nil
  #     bypass_named_maps

  #     put_json viz_analysis_url(@user, @visualization, @analysis), new_payload do |response|
  #       response.status.should eq 200
  #       response.body[:analysis_definition].symbolize_keys.should eq new_payload[:analysis_definition]
  #       a = Carto::Analysis.find(@analysis.id)
  #       a.analysis_definition[:id].should eq new_payload[:analysis_definition][:id]
  #       a.analysis_definition[new_key].should eq new_payload[:analysis_definition][new_key]

  #       a.analysis_definition.deep_symbolize_keys.should eq new_payload[:analysis_definition].deep_symbolize_keys
  #     end
  #   end

  #   it 'returns 422 if payload visualization_id or id do not match' do
  #     put_json viz_analysis_url(@user, @visualization, @analysis),
  #              new_payload.merge(visualization_id: 'x') do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), new_payload.merge(id: 'x') do |response|
  #       response.status.should eq 422
  #     end
  #   end

  #   it 'returns 403 if user does not own the visualization' do
  #     put_json viz_analysis_url(@user2, @visualization, @analysis), new_payload do |response|
  #       response.status.should eq 403
  #     end
  #   end

  #   it 'returns 422 if payload is not valid json' do
  #     put_json viz_analysis_url(@user, @visualization, @analysis), nil do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), "" do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), "wadus" do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), "wadus: 1" do |response|
  #       response.status.should eq 422
  #     end
  #   end

  #   it 'returns 422 if payload is empty json' do
  #     put_json viz_analysis_url(@user, @visualization, @analysis), {} do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), [] do |response|
  #       response.status.should eq 422
  #     end
  #   end

  #   it 'returns 422 if analysis definition is not valid json' do
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: nil do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "" do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "wadus" do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "wadus: 1" do |response|
  #       response.status.should eq 422
  #     end
  #   end

  #   it 'returns 422 if analysis_definition is empty json' do
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: {} do |response|
  #       response.status.should eq 422
  #     end
  #     put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: [] do |response|
  #       response.status.should eq 422
  #     end
  #   end
  # end

  # describe '#destroy' do
  #   it 'destroys existing analysis' do
  #     bypass_named_maps
  #     delete_json viz_analysis_url(@user, @visualization, @analysis) do |response|
  #       response.status.should eq 200
  #       Carto::Analysis.where(id: @analysis.id).first.should be_nil
  #     end
  #   end

  #   it 'returns 403 if user does not own the visualization' do
  #     delete_json viz_analysis_url(@user2, @visualization, @analysis) do |response|
  #       response.status.should eq 403
  #     end
  #   end
  # end
end
