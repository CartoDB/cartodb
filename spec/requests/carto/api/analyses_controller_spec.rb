require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'
require_dependency 'carto/uuidhelper'

describe Carto::Api::AnalysesController do
  include Carto::Factories::Visualizations
  include HelperMethods

  before(:all) do
    FactoryGirl.create(:carto_feature_flag, name: 'editor-3', restricted: false)
    @user = FactoryGirl.create(:carto_user, builder_enabled: true)
    @user2 = FactoryGirl.create(:carto_user, builder_enabled: true)
    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    bypass_named_maps
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

  def clean_analysis_definition(analysis_definition)
    # Remove options[:style_history] from all nested nodes for comparison
    definition_node = Carto::AnalysisNode.new(analysis_definition.deep_symbolize_keys)
    definition_node.descendants.each do |n|
      n.definition[:options].delete(:style_history) if n.definition[:options].present?
      n.definition.delete(:options) if n.definition[:options] == {}
    end

    definition_node.definition
  end

  describe '#show' do
    it 'returns 403 if user does not own the visualization' do
      get_json viz_analysis_url(@user2, @visualization, @analysis.id) do |response|
        response.status.should eq 403
      end
    end

    def verify_analysis_response_body(response_body, analysis)
      response_body[:id].should eq analysis.id
      analysis_definition = response_body[:analysis_definition]
      clean_analysis_definition(analysis_definition).should eq clean_analysis_definition(analysis.analysis_definition)
      analysis_definition[:id].should eq analysis.natural_id
    end

    it 'returns existing analysis by uuid' do
      get_json viz_analysis_url(@user, @visualization, @analysis.id) do |response|
        response.status.should eq 200
        verify_analysis_response_body(response[:body], @analysis)
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
        verify_analysis_response_body(response[:body], @analysis)
      end
    end

    it 'returns existing analysis by json first id with uuid ids' do
      bypass_named_maps
      analysis2 = FactoryGirl.create(
        :source_analysis,
        visualization_id: @visualization.id,
        user_id: @user.id,
        analysis_definition: { id: UUIDTools::UUID.random_create.to_s }
      )

      get_json viz_analysis_url(@user, @visualization, analysis2.natural_id) do |response|
        response.status.should eq 200
        verify_analysis_response_body(response[:body], analysis2)
      end

      analysis2.destroy
    end
  end

  let(:natural_id) { 'a1' }

  let(:payload) { { analysis_definition: { id: natural_id } } }

  describe '#create' do
    def create_analysis_url(user, visualization)
      analyses_url(
        user_domain: user.username,
        api_key: user.api_key,
        visualization_id: visualization.id)
    end

    it 'creates new analysis' do
      bypass_named_maps
      post_json create_analysis_url(@user, @visualization), payload do |response|
        response.status.should eq 201
        response.body[:id].should_not be_nil
        analysis_definition = clean_analysis_definition(response.body[:analysis_definition])
        analysis_definition.should eq payload[:analysis_definition]

        a = Carto::Analysis.find_by_natural_id(@visualization.id, natural_id)
        a.should_not eq nil
        a.user_id.should eq @user.id
        a.visualization_id.should eq @visualization.id
        clean_analysis_definition(a.analysis_definition).should eq payload[:analysis_definition].deep_symbolize_keys

        a.destroy
      end
    end

    it 'registers table dependencies when creating analysis' do
      bypass_named_maps
      # Twice because of destroy
      Carto::Layer.any_instance.expects(:register_table_dependencies).times(@visualization.data_layers.count * 2)
      post_json create_analysis_url(@user, @visualization), payload do |response|
        response.status.should eq 201

        a = Carto::Analysis.find(response.body[:id])
        a.destroy
      end
    end

    it 'overrides old analysis in the same visualization if they have the same natural id' do
      bypass_named_maps
      Carto::Analysis.where(visualization_id: @visualization.id).count.should eq 1

      updated_analysis = { analysis_definition: @analysis.analysis_definition }
      updated_analysis[:analysis_definition][:params] = { query: 'select * from whatever_overrided' }

      post_json create_analysis_url(@user, @visualization), updated_analysis do |response|
        response.status.should eq 201

        # Check that update worked
        response_body = response.body
        response_body[:id].should eq @analysis.id
        response_body[:analysis_definition][:id].should eq @analysis.natural_id
        clean_analysis_definition(response_body[:analysis_definition]).should eq clean_analysis_definition(updated_analysis[:analysis_definition])
      end

      # Check that no analysis is _added_
      analyses = Carto::Analysis.where(visualization_id: @visualization.id).all
      analyses.count.should eq 1
      new_analysis = analyses.first
      new_analysis.analysis_definition.should eq updated_analysis[:analysis_definition]
      new_analysis.updated_at.should be > @analysis.updated_at

      # Check that the old analysis was updated
      @analysis.reload
      new_analysis.created_at.should eq @analysis.created_at
      new_analysis.updated_at.should eq @analysis.updated_at
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

    it 'returns 422 if analysis definition is not valid json' do
      post_json create_analysis_url(@user, @visualization), analysis_definition: nil do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), analysis_definition: "" do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), analysis_definition: "wadus" do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), analysis_definition: "wadus: 1" do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if analysis_definition is empty json' do
      post_json create_analysis_url(@user, @visualization), analysis_definition: {} do |response|
        response.status.should eq 422
      end
      post_json create_analysis_url(@user, @visualization), analysis_definition: [] do |response|
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

    let(:new_key) { :whatever }

    let(:new_payload) do
      payload.delete(:id)
      payload.merge(whatever: 'really?')
      payload[:analysis_definition][:id] = new_natural_id
      payload[:analysis_definition][new_key] = 'really'
      payload
    end

    it 'updates existing analysis' do
      @analysis.reload
      @analysis.analysis_definition[:id].should_not eq new_payload[:analysis_definition][:id]
      @analysis.analysis_definition[new_key].should be_nil
      bypass_named_maps

      put_json viz_analysis_url(@user, @visualization, @analysis), new_payload do |response|
        response.status.should eq 200
        clean_analysis_definition(response.body[:analysis_definition]).should eq clean_analysis_definition(new_payload[:analysis_definition])
        a = Carto::Analysis.find(@analysis.id)
        a.analysis_definition[:id].should eq new_payload[:analysis_definition][:id]
        a.analysis_definition[new_key].should eq new_payload[:analysis_definition][new_key]

        a.analysis_definition.deep_symbolize_keys.should eq new_payload[:analysis_definition].deep_symbolize_keys
      end
    end

    it 'registers table dependencies when updating existing analysis' do
      bypass_named_maps
      Carto::Layer.any_instance.expects(:register_table_dependencies).times(@visualization.data_layers.count)
      put_json viz_analysis_url(@user, @visualization, @analysis), new_payload do |response|
        response.status.should eq 200
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

    it 'returns 422 if payload is not valid json' do
      put_json viz_analysis_url(@user, @visualization, @analysis), nil do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), "" do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), "wadus" do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), "wadus: 1" do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if payload is empty json' do
      put_json viz_analysis_url(@user, @visualization, @analysis), {} do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), [] do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if analysis definition is not valid json' do
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: nil do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "" do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "wadus" do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: "wadus: 1" do |response|
        response.status.should eq 422
      end
    end

    it 'returns 422 if analysis_definition is empty json' do
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: {} do |response|
        response.status.should eq 422
      end
      put_json viz_analysis_url(@user, @visualization, @analysis), analysis_definition: [] do |response|
        response.status.should eq 422
      end
    end
  end

  describe '#destroy' do
    it 'destroys existing analysis' do
      bypass_named_maps
      delete_json viz_analysis_url(@user, @visualization, @analysis) do |response|
        response.status.should eq 200
        Carto::Analysis.where(id: @analysis.id).first.should be_nil
      end
    end

    it 'registers table dependencies when destroying existing analysis' do
      bypass_named_maps
      analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
      Carto::Layer.any_instance.expects(:register_table_dependencies).times(@visualization.data_layers.count)
      delete_json viz_analysis_url(@user, @visualization, analysis) do |response|
        response.status.should eq 200
        Carto::Analysis.where(id: analysis.id).first.should be_nil
      end
    end

    it 'returns 403 if user does not own the visualization' do
      delete_json viz_analysis_url(@user2, @visualization, @analysis) do |response|
        response.status.should eq 403
      end
    end
  end

  describe '#LayerNodeStyle cache' do
    before(:all) do
      @styled_analysis = FactoryGirl.create(:analysis_point_in_polygon, visualization_id: @visualization.id, user_id: @user.id)
      @layer_id = @visualization.data_layers.first.id
    end

    before(:each) do
      @styled_analysis.analysis_node.descendants.map(&:id).each do |node_id|
        Carto::LayerNodeStyle.create(
          layer_id: @layer_id,
          source_id: node_id,
          options: {
            tile_style: 'wadus'
          },
          infowindow: {},
          tooltip: {}
        )
      end
    end

    after(:each) do
      Carto::LayerNodeStyle.where(layer_id: @layer_id).delete_all
    end

    it '#show returns tile styles' do
      get_json viz_analysis_url(@user, @visualization, @styled_analysis.id) do |response|
        response.status.should eq 200
        Carto::AnalysisNode.new(response[:body][:analysis_definition].deep_symbolize_keys).descendants.each do |node|
          node.options[:style_history][@layer_id.to_sym][:options][:tile_style].should eq 'wadus'
        end
      end
    end

    it '#show returns tile styles for torque layers' do
      Carto::Layer.any_instance.stubs(:kind).returns('torque')
      get_json viz_analysis_url(@user, @visualization, @styled_analysis.id) do |response|
        response.status.should eq 200
        Carto::AnalysisNode.new(response[:body][:analysis_definition].deep_symbolize_keys).descendants.each do |node|
          node.options[:style_history][@layer_id.to_sym][:options][:tile_style].should eq 'wadus'
        end
      end
    end

    it '#update invalidates the affected node' do
      @styled_analysis.analysis_node.params[:dummy] = 'yes'
      new_payload = {
        id: @styled_analysis.id,
        analysis_definition: @styled_analysis.analysis_definition
      }
      @styled_analysis.reload
      put_json viz_analysis_url(@user, @visualization, @styled_analysis), new_payload do |response|
        response.status.should eq 200
      end

      # Should only invalidate the parent
      updated_ids = [@styled_analysis.natural_id]
      @styled_analysis.analysis_node.descendants.map(&:id).each do |node_id|
        modified = updated_ids.include?(node_id)
        Carto::LayerNodeStyle.from_visualization_and_source(@visualization, node_id).any?.should eq !modified
      end
    end

    it '#update invalidates the affected node and its parent' do
      first_child = @styled_analysis.analysis_node.children.first
      first_child.params[:dummy] = 'yes'
      new_payload = {
        id: @styled_analysis.id,
        analysis_definition: @styled_analysis.analysis_definition
      }
      @styled_analysis.reload
      put_json viz_analysis_url(@user, @visualization, @styled_analysis), new_payload do |response|
        response.status.should eq 200
      end

      # Should invalidate the first child and the parent
      updated_ids = [@styled_analysis.natural_id, first_child.id]
      @styled_analysis.analysis_node.descendants.map(&:id).each do |node_id|
        modified = updated_ids.include?(node_id)
        Carto::LayerNodeStyle.from_visualization_and_source(@visualization, node_id).any?.should eq !modified
      end
    end

    it '#update does not invalidate upon options change' do
      @styled_analysis.reload
      @styled_analysis.analysis_node.options[:dummy] = 'yes'
      new_payload = {
        id: @styled_analysis.id,
        analysis_definition: @styled_analysis.analysis_definition
      }
      @styled_analysis.reload
      put_json viz_analysis_url(@user, @visualization, @styled_analysis), new_payload do |response|
        response.status.should eq 200
      end

      # Should not invalidate anything
      @styled_analysis.analysis_node.descendants.map(&:id).each do |node_id|
        Carto::LayerNodeStyle.from_visualization_and_source(@visualization, node_id).any?.should be_true
      end
    end

    it '#update does not invalidate upon children node_id change' do
      @styled_analysis.reload
      first_child = @styled_analysis.analysis_node.children.first
      first_child.definition[:id] = 'bogus'
      new_payload = {
        id: @styled_analysis.id,
        analysis_definition: @styled_analysis.analysis_definition
      }
      @styled_analysis.reload
      put_json viz_analysis_url(@user, @visualization, @styled_analysis), new_payload do |response|
        response.status.should eq 200
      end

      # Should not invalidate anything
      @styled_analysis.analysis_node.descendants.map(&:id).each do |node_id|
        Carto::LayerNodeStyle.from_visualization_and_source(@visualization, node_id).any?.should be_true
      end
    end
  end
end
