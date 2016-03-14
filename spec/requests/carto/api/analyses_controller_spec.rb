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
    @user2 = FactoryGirl.create(:carto_user)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    @analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
  end

  after(:all) do
    Carto::FeatureFlag.destroy_all
    destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    # This avoids connection leaking.
    ::User[@user.id].destroy
    ::User[@user2.id].destroy
    @analysis.destroy
  end

  def viz_analysis_url(user, visualization, analysis_id)
    analysis_url(
      user_domain: user.username,
      api_key: user.api_key,
      visualization_id: visualization.id,
      id: analysis_id)
  end

  describe '#show' do
    it 'returns 403 if user does not own the visualization' do
      get_json viz_analysis_url(@user2, @visualization, @analysis.id) do |response|
        response.status.should eq 403
      end
    end

    it 'returns existing analysis by uuid' do
      get_json viz_analysis_url(@user, @visualization, @analysis.id) do |response|
        response.status.should eq 200
        response[:body].should eq @analysis.params_json
      end
    end

    it 'returns 404 for nonexisting analysis' do
      get_json viz_analysis_url(@user, @visualization, 'wadus') do |response|
        response.status.should eq 404
      end
    end

    it 'returns existing analysis by json first id' do
      get_json viz_analysis_url(@user, @visualization, @analysis.natural_id) do |response|
        response.status.should eq 200
        response[:body].should eq @analysis.params_json
        response[:body][:id].should_not be_nil
        response[:body][:id].should eq @analysis.natural_id
      end
    end

    it 'returns existing analysis by json first id with uuid ids' do
      analysis2 = FactoryGirl.create(
        :source_analysis,
        visualization_id: @visualization.id,
        user_id: @user.id,
        params: %({"id": "#{UUIDTools::UUID.random_create}"})
      )

      get_json viz_analysis_url(@user, @visualization, analysis2.natural_id) do |response|
        response.status.should eq 200
        response[:body].should eq analysis2.params_json
        response[:body][:id].should_not be_nil
        response[:body][:id].should eq analysis2.natural_id
      end

      analysis2.destroy
    end
  end

  let(:natural_id) { 'a1' }

  let(:payload) { { id: natural_id } }

  describe '#create' do
    def create_analysis_url(user, visualization)
      analyses_url(
        user_domain: user.username,
        api_key: user.api_key,
        visualization_id: visualization.id)
    end

    it 'creates new analysis' do
      post_json create_analysis_url(@user, @visualization), payload do |response|
        response.status.should eq 201
        response.body[:id].should eq natural_id
        a = Carto::Analysis.find_by_natural_id(@visualization.id, natural_id)
        a.should_not eq nil
        a.user_id.should eq @user.id
        a.visualization_id.should eq @visualization.id
        a.params_json.should eq payload
      end
    end

    it 'returns 422 if payload visualization or user id do not match with url' do
      post_json create_analysis_url(@user, @visualization), payload.merge(visualization_id: 'x') do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if payload is not valid json' do
      post_json create_analysis_url(@user, @visualization), nil do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), "" do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), "wadus" do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), "wadus: 1" do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if payload is empty json' do
      post_json create_analysis_url(@user, @visualization), {} do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), [] do |response|
        response.status.should eq 422
      end
    end

    it 'returns 403 if user does not own the visualization' do
      post_json create_analysis_url(@user2, @visualization), payload do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#update' do
    let(:new_natural_id) { "#{natural_id}_2" }

    let(:new_payload) do
      payload.delete(:id)
      payload.merge(whatever: 'really?')
    end

    it 'updates existing analysis' do
      put_json viz_analysis_url(@user, @visualization, @analysis), new_payload do |response|
        response.status.should eq 200
        response.body.should eq new_payload
        a = Carto::Analysis.find(@analysis.id)
        a.params_json.should eq new_payload
      end
    end

    it 'returns 422 if payload visualization_id or id do not match' do
      put_json viz_analysis_url(@user, @visualization, @analysis),
               new_payload.merge(visualization_id: 'x') do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), new_payload.merge(id: 'x') do |response|
        response.status.should eq 422
      end
    end

    it 'returns 403 if user does not own the visualization' do
      put_json viz_analysis_url(@user2, @visualization, @analysis), new_payload do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#destroy' do
    it 'destroys existing analysis' do
      delete_json viz_analysis_url(@user, @visualization, @analysis) do |response|
        response.status.should eq 200
        Carto::Analysis.where(id: @analysis.id).first.should be_nil
      end
    end

    it 'returns 403 if user does not own the visualization' do
      delete_json viz_analysis_url(@user2, @visualization, @analysis) do |response|
        response.status.should eq 403
      end
    end
  end
end
