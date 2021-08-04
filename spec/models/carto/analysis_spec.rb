require 'spec_helper_unit'
require 'support/helpers'

describe Carto::Analysis do
  let(:definition_with_options) do
    {
      id: "a1",
      type: "buffer",
      params: {
        distance: 100
      },
      options: {
        unit: "m"
      }
    }
  end

  let(:nested_definition_with_options) do
    {
      id: "a1",
      type: "buffer",
      params: {
        source: definition_with_options
      }
    }
  end

  let(:point_in_polygon_definition_with_options) do
    {
      id: "a2",
      type: "point-in-polygon",
      options: { primary_source_name: "polygons_source" },
      params: {
        polygon_source: definition_with_options,
        points_source: {
          id: "table",
          type: "source",
          params: { query: "SELECT * FROM table" },
          options: { table_name: "table" }
        }
      }
    }
  end

  describe '#natural_id' do
    it 'returns nil if analysis definition has no id at the first level' do
      Carto::Analysis.new(analysis_definition: nil).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: {}).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: { "wadus" => 1 }).natural_id.should eq nil
      Carto::Analysis.new(analysis_definition: { wadus: 1 }).natural_id.should eq nil
    end

    it 'returns id if analysis definition has id at the first level' do
      Carto::Analysis.new(analysis_definition: { id: "a1" }).natural_id.should eq 'a1'
    end
  end

  describe '#analysis_definition' do
    it 'removes options from analysis definition' do
      analysis = Carto::Analysis.new(analysis_definition: definition_with_options)
      analysis.analysis_definition.include?(:options).should be_true
      analysis.analysis_definition_for_api.include?(:options).should be_false
    end

    it 'removes options from nested source analysis' do
      analysis = Carto::Analysis.new(analysis_definition: nested_definition_with_options)

      nested_analysis = analysis.analysis_definition_for_api[:params][:source]
      nested_analysis.include?(:options).should be_false
    end

    it 'removes options from nested source analysis with multiple sources' do
      analysis = Carto::Analysis.new(analysis_definition: point_in_polygon_definition_with_options)

      polygon_analysis = analysis.analysis_definition_for_api[:params][:polygon_source]
      polygon_analysis.include?(:options).should be_false

      points_analysis = analysis.analysis_definition_for_api[:params][:points_source]
      points_analysis.include?(:options).should be_false
    end
  end

  describe '#analysis_node' do
    it 'returns an analysis node with the definition of the analysis' do
      analysis = Carto::Analysis.new(analysis_definition: definition_with_options)
      node = analysis.analysis_node
      node.definition.should eq analysis.analysis_definition
      node.children.should be_empty
    end

    it 'returns an analysis tree' do
      analysis = Carto::Analysis.new(analysis_definition: nested_definition_with_options)
      root = analysis.analysis_node
      root.definition.should eq analysis.analysis_definition

      children = root.children
      children.should_not be_empty
      children[0].children.should be_empty
      children[0].definition.should eq definition_with_options
    end
  end

  describe '#save' do
    include Carto::Factories::Visualizations
    include HelperMethods

    before do
      bypass_named_maps
      @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      @analysis = create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)
    end

    it 'triggers notify_map_change on related map(s)' do
      map = mock
      map.stubs(:id).returns(@map.id)
      map.stubs(:data_layers).returns([])
      map.expects(:update_dataset_dependencies).once
      map.expects(:notify_map_change).once
      Map.stubs(:where).with(id: map.id).returns([map])
      @analysis.stubs(:map).returns(map)

      @analysis.analysis_definition = definition_with_options
      @analysis.save
    end
  end

  context 'viewer users' do
    include Carto::Factories::Visualizations
    include HelperMethods

    before do
      @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    end

    it "can't create a new analysis" do
      @user.viewer = true
      @user.save

      @analysis = build(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)

      @analysis.save.should be_false
      @analysis.errors[:user].should eq(["Viewer users can't edit analyses"])
    end

    it "can't delete analyses" do
      @analysis = create(:source_analysis, visualization_id: @visualization.id, user_id: @user.id)

      @user.viewer = true
      @user.save
      @analysis.reload

      @analysis.destroy.should eq false
      Carto::Analysis.exists?(@analysis.id).should eq true
      @analysis.errors[:user].should eq(["Viewer users can't edit analyses"])
    end
  end

  describe '#source_analysis_for_layer' do
    include Carto::Factories::Visualizations

    context 'with regular user' do
      let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
      let(:visualization_objects) { create_full_visualization(user) }
      let(:layer) { visualization_objects[3].data_layers.first }
      let(:table_name) { visualization_objects[1].name }

      it 'copies the layer query' do
        layer.options[:query] = 'SELECT * FROM wadus'
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.params[:query].should).to eq('SELECT * FROM wadus')
      end

      it 'copies the layer table_name prepending "public"' do
        layer.options[:table_name] = table_name
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.options[:table_name]).to eq("public.#{table_name}")
      end

      it 'prepends "public" to table_name' do
        layer.options.merge!(table_name: table_name, user_name: 'juan')
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.options[:table_name]).to eq("public.#{table_name}")
      end
    end

    context 'with organization user' do
      let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
      let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
      let(:visualization_objects) { create_full_visualization(organization.owner) }
      let(:layer) { visualization_objects[3].data_layers.first }
      let(:table_name) { visualization_objects[1].name }

      it 'copies the layer query' do
        layer.options[:query] = 'SELECT * FROM wadus'
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.params[:query]).to eq('SELECT * FROM wadus')
      end

      it 'always qualifies table_name in organizations' do
        layer.options.merge!(table_name: table_name, user_name: organization_owner.username)
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.options[:table_name]).to eq("#{organization_owner.username}.#{table_name}")
      end

      it 'uses default SQL query if missing' do
        layer.options.merge!(table_name: table_name, user_name: organization_owner.username, query: '')
        analysis = described_class.source_analysis_for_layer(layer, 0)

        expect(analysis.analysis_node.params[:query]).to(
          eq("SELECT * FROM #{organization_owner.username}.#{table_name}")
        )
      end
    end
  end
end
