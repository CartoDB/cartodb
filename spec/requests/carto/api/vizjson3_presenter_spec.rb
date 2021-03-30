require 'spec_helper_min'
require 'mock_redis'
require 'carto/api/vizjson3_presenter'
require 'carto/api/vizjson_presenter'

describe Carto::Api::VizJSON3Presenter do
  include Carto::Factories::Visualizations
  include_context 'visualization creation helpers'

  before(:all) do
    @user1 = create(:carto_user, private_tables_enabled: true)
  end

  after(:all) do
    @user1.destroy
  end

  let(:redis_mock) do
    MockRedis.new
  end

  shared_context 'full visualization' do
    before(:all) do
      bypass_named_maps
      @map, @table, @table_visualization, @visualization = create_full_visualization(Carto::User.find(@user1.id))
      @table.update_attribute(:privacy, Carto::UserTable::PRIVACY_PUBLIC)
    end

    after(:all) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    let(:viewer_user) { @visualization.user }
  end

  describe 'caching' do
    include_context 'full visualization'

    let(:fake_vizjson) { { fake: 'sure!', layers: [] } }

    it 'to_vizjson uses the redis vizjson cache' do
      cache_mock = mock
      cache_mock.expects(:cached).with(@visualization.id, false, 3).twice.returns(fake_vizjson)
      presenter = Carto::Api::VizJSON3Presenter.new(@visualization, cache_mock)
      v1 = presenter.to_vizjson
      v2 = presenter.to_vizjson
      v1.should eq fake_vizjson
      v1.should eq v2
    end

    it 'every call to_vizjson uses calculate_vizjson if no cache is provided' do
      presenter = Carto::Api::VizJSON3Presenter.new(@visualization, nil)
      presenter.expects(:calculate_vizjson).twice.returns(fake_vizjson)
      presenter.to_vizjson
      presenter.to_vizjson
    end

    it 'to_vizjson is not overriden by v2 caching or to_named_map_vizjson' do
      v2_presenter = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata)
      v3_presenter = Carto::Api::VizJSON3Presenter.new(@visualization)

      v2_vizjson = v2_presenter.to_vizjson
      v3_vizjson = v3_presenter.to_vizjson
      v3n_vizjson = v3_presenter.to_named_map_vizjson

      v3_vizjson.should_not eq v2_vizjson
      v2_vizjson[:version].should eq '0.1.0'
      v3_vizjson[:version].should eq '3.0.0'
      v3n_vizjson[:version].should eq '3.0.0'
    end

    it 'to_vizjson does not override v2 caching or named map vizjson' do
      v2_presenter = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata)
      v3_presenter = Carto::Api::VizJSON3Presenter.new(@visualization)

      v3_vizjson = v3_presenter.to_vizjson
      v2_vizjson = v2_presenter.to_vizjson
      v3n_vizjson = v3_presenter.to_named_map_vizjson

      v2_vizjson.should_not eq v3_vizjson
      v3n_vizjson.should_not eq v3_vizjson
      v2_vizjson[:version].should eq '0.1.0'
      v3_vizjson[:version].should eq '3.0.0'
      v3n_vizjson[:version].should eq '3.0.0'
    end

    it 'to_named_map_vizjson uses the redis vizjson cache' do
      fake_vizjson = { fake: 'sure!', layers: [] }

      cache_mock = mock
      cache_mock.expects(:cached).with(@visualization.id, false, anything).returns(fake_vizjson).twice
      presenter = Carto::Api::VizJSON3Presenter.new(@visualization, cache_mock)
      v1 = presenter.to_named_map_vizjson
      v2 = presenter.to_named_map_vizjson
      v1.should eq fake_vizjson
      v1.should eq v2
    end
  end

  describe '#to_vizjson (without caching)' do
    include_context 'full visualization'

    it 'returns map bounds' do
      presenter = Carto::Api::VizJSON3Presenter.new(@visualization, nil)
      presenter.to_vizjson[:bounds].should eq [[-85.0511, -179], [85.0511, 179]]
    end

    it 'returns nil map bounds if map bounds are not set' do
      @visualization.map.view_bounds_sw = nil
      @visualization.map.view_bounds_ne = nil

      Carto::Api::VizJSON3Presenter.new(@visualization, nil).to_vizjson[:bounds].should be_nil
    end
  end

  describe '#to_named_map_vizjson' do
    include_context 'full visualization'

    it 'generates the vizjson of visualizations that have not named map as if they had' do
      @table.privacy = Carto::UserTable::PRIVACY_PUBLIC
      @table.save
      @visualization = Carto::Visualization.find(@visualization.id)
      v3_presenter = Carto::Api::VizJSON3Presenter.new(@visualization, nil)

      original_vizjson = v3_presenter.to_vizjson.reject { |k, _| k == :updated_at }
      original_named_vizjson = v3_presenter.to_named_map_vizjson.reject { |k, _| k == :updated_at }
      original_vizjson.should_not eq original_named_vizjson

      @table.privacy = Carto::UserTable::PRIVACY_PRIVATE
      @table.save!
      @visualization = Carto::Visualization.find(@visualization.id)
      v3_presenter = Carto::Api::VizJSON3Presenter.new(@visualization, nil)

      named_vizjson = v3_presenter.to_vizjson.reject { |k, _| k == :updated_at }
      original_named_vizjson.should eq named_vizjson
      named_named_vizjson = v3_presenter.to_vizjson.reject { |k, _| k == :updated_at }
      named_named_vizjson.should eq named_vizjson
    end

    it 'includes analyses information without including sources parameters' do
      analysis = create(:analysis_with_source, visualization: @visualization, user: @user1)
      analysis.analysis_definition[:params].should_not be_nil
      @visualization.reload
      v3_presenter = Carto::Api::VizJSON3Presenter.new(@visualization, nil)
      named_vizjson = v3_presenter.to_vizjson
      analyses_json = named_vizjson[:analyses]
      analyses_json.should_not be_nil
      source_analysis_definition = analyses_json[0][:params][:source]
      source_analysis_definition[:type].should eq 'source'
      source_analysis_definition[:params].should be_nil
    end

    it 'allows whitespace layer names' do
      layer = @visualization.data_layers.first
      layer.options['table_name_alias'] = ' '
      layer.save
      @visualization.reload

      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send :calculate_vizjson
      v3_vizjson[:layers][1][:options][:layer_name].should eq ' '
    end

    it 'includes source at layers options' do
      source = 'a1'
      layer = @visualization.data_layers.first
      layer.options['source'] = source
      layer.save
      @table.privacy = Carto::UserTable::PRIVACY_PRIVATE
      @table.save!
      @visualization.reload

      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send :calculate_vizjson
      v3_vizjson[:layers][1][:options][:source].should eq source
    end

    it 'includes cartocss at layers options' do
      cartocss = '#layer { marker-fill: #fabada; }'
      layer = @visualization.data_layers.first
      layer.options['tile_style'] = cartocss
      layer.save
      @table.privacy = Carto::UserTable::PRIVACY_PRIVATE
      @table.save!
      @visualization.reload

      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send :calculate_vizjson
      v3_vizjson[:layers][1][:options][:cartocss].should eq cartocss
    end
  end

  describe 'analyses' do
    include_context 'full visualization'

    it 'sends `source` at layer options instead of sql if source is set for named maps' do
      query = "select * from #{@table.name}"

      layer = @visualization.data_layers.first
      layer.options['source'].should eq nil
      layer.options['query'] = query
      layer.save

      # INFO: send :calculate_vizjson won't use cache
      v2_vizjson = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).send(:calculate_vizjson)
      nm_vizjson = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).send(:calculate_vizjson, for_named_map: true)
      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send(:calculate_vizjson)

      v2_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:sql].should eq query
      v2_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:source].should be_nil
      nm_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:sql].should eq query
      nm_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:source].should be_nil
      v3_vizjson[:layers][1][:options][:sql].should eq query
      v3_vizjson[:layers][1][:options][:source].should be_nil

      source = 'a1'
      layer.options['source'] = source
      layer.save
      @visualization.reload

      v2_vizjson = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).send(:calculate_vizjson)
      nm_vizjson = Carto::Api::VizJSONPresenter.new(@visualization, $tables_metadata).send(:calculate_vizjson, for_named_map: true)
      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send(:calculate_vizjson)

      v2_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:sql].should eq query
      v2_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:source].should be_nil
      nm_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:sql].should be_nil
      nm_vizjson[:layers][1][:options][:layer_definition][:layers][0][:options][:source].should eq(id: source)
      v3_vizjson[:layers][1][:options][:sql].should be_nil
      v3_vizjson[:layers][1][:options][:source].should eq source
    end
  end

  describe 'anonymous_vizjson' do
    include_context 'full visualization'

    it 'v3 should include sql_wrap' do
      v3_vizjson = Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user).send(:calculate_vizjson)
      v3_vizjson[:layers][1][:options][:sql_wrap].should eq "select * from (<%= sql %>) __wrap"
    end
  end

  describe 'layers' do
    include_context 'full visualization'

    before(:all) do
      @data_layer = @map.data_layers.first
      @data_layer.options[:attribution] = 'CARTO attribution'
      @data_layer.save

      @torque_layer = create(:carto_layer, kind: 'torque', maps: [@map])
      @torque_layer.options[:table_name] = 'wadus'
      @torque_layer.save

      @visualization.reload
    end

    shared_examples 'common layer checks' do
      it 'should not include layergroup layers' do
        vizjson[:layers].map { |l| l[:type] }.should_not include 'layergroup'
      end

      it 'should not include namedmap layers' do
        vizjson[:layers].map { |l| l[:type] }.should_not include 'namedmap'
      end

      it 'should have exactly three layers: tiled, CartoDB and torque' do
        vizjson[:layers].map { |l| l[:type] }.should eq %w(tiled CartoDB torque)
      end

      it 'should include attribution for all layers' do
        vizjson[:layers].each { |l| l[:options].should include :attribution }
      end

      it 'should not include named map options in any layer' do
        vizjson[:layers].each do |l|
          options = l[:options]
          options.should_not include :stat_tag
          options.should_not include :maps_api_template
          options.should_not include :sql_api_template
          options.should_not include :named_map
        end
      end

      it 'should not include interactivity in any layer' do
        vizjson[:layers].each do |l|
          l.should_not include :interactivity
          l[:options].should_not include :interactivity
        end
      end

      it 'should not include infowindow nor tooltip in basemaps' do
        vizjson[:layers].each do |l|
          if l[:type] == 'tiled'
            l.should_not include :infowindow
            l.should_not include :tooltip
          end
        end
      end

      it 'should not include order in any layer' do
        vizjson[:layers].each do |l|
          l.should_not include :order
        end
      end

      it 'should include layer_name in options for data layers' do
        vizjson[:layers].each do |layer|
          unless layer[:type] == 'tiled'
            layer.should_not include :layer_name
            layer[:options][:layer_name].should be
          end
        end
      end

      it 'should not include Odyssey options' do
        vizjson.should_not include :prev
        vizjson.should_not include :next
        vizjson.should_not include :transition_options
      end
    end

    describe 'in namedmap vizjson' do
      let(:vizjson) do
        Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user)
                                     .send(:calculate_vizjson, forced_privacy_version: :force_named)
      end

      include_examples 'common layer checks'

      it 'should not include sql field in data layers' do
        data_layer_options = vizjson[:layers][1][:options]
        data_layer_options.should_not include :sql
      end

      it 'should include cartocss but not sql in torque layers' do
        torque_layer = vizjson[:layers][2]
        torque_layer.should_not include :sql
        torque_layer[:cartocss].should be
        torque_layer[:cartocss_version].should be
      end
    end

    describe 'in anonymous vizjson' do
      let(:vizjson) do
        Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user)
                                     .send(:calculate_vizjson, forced_privacy_version: :force_anonymous)
      end

      include_examples 'common layer checks'

      it 'should include sql and cartocss fields in data layers' do
        data_layer_options = vizjson[:layers][1][:options]
        data_layer_options[:sql].should be
        data_layer_options[:cartocss].should be
        data_layer_options[:cartocss_version].should be
      end

      it 'should include sql and cartocss fields in torque layers' do
        torque_layer = vizjson[:layers][2]
        torque_layer[:sql].should be
        torque_layer[:cartocss].should be
        torque_layer[:cartocss_version].should be
      end
    end

    describe 'overlays' do
      include_context 'full visualization'

      def vizjson
        Carto::Api::VizJSON3Presenter.new(@visualization, viewer_user)
                                     .send(:calculate_vizjson, forced_privacy_version: :force_anonymous)
      end

      it 'enables map layer_selector option if there is a layer_selector overlay' do
        vizjson[:options]['layer_selector'].should eq false
        @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')
        vizjson[:options]['layer_selector'].should eq true
      end

      it 'removes layer selector overlay ' do
        @visualization.overlays << Carto::Overlay.new(type: 'layer_selector')
        vizjson[:overlays].any? { |o| o[:type] == 'layer_selector' }.should be_false
      end
    end
  end
end
