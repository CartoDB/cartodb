require 'spec_helper_min'

describe Carto::VisualizationsExportService2 do
  include NamedMapsHelper

  before(:each) do
    bypass_named_maps
  end

  let(:export) do
    {
      visualization: base_visualization_export,
      version: 2
    }
  end

  let(:base_visualization_export) do
    {
      name: 'the name',
      description: 'the description',
      type: 'derived', # derived / remote / table / slide
      tags: ['tag 1', 'tag 2'],
      privacy: 'private', # private / link / public
      source: 'the source',
      license: 'mit',
      title: 'the title',
      kind: 'geom', # geom / raster
      attributions: 'the attributions',
      bbox: '0103000000010000000500000031118AC72D246AC1A83916DE775E51C131118AC72D246AC18A9C928550D5614101D5E410F03E7' +
        '0418A9C928550D5614101D5E410F03E7041A83916DE775E51C131118AC72D246AC1A83916DE775E51C1',
      display_name: 'the display_name',
      map: {
        provider: 'leaflet',
        bounding_box_sw: '[-85.0511, -179]',
        bounding_box_ne: '[85.0511, 179]',
        center: '[34.672410587, 67.90919030050006]',
        zoom: 1,
        view_bounds_sw: '[15.775376695, -18.1672257149999]',
        view_bounds_ne: '[53.569444479, 153.985606316]',
        scrollwheel: false,
        legends: true
      },
      layers: [
        {
          options: JSON.parse('{"default":true,' +
            '"url":"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",' +
            '"subdomains":"abcd","minZoom":"0","maxZoom":"18","name":"Positron",' +
            '"className":"positron_rainbow_labels","attribution":"\u00a9 <a ' +
            'href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 ' +
            '<a href=\"http://cartodb.com/attributions#basemaps\">CartoDB</a>",' +
            '"labels":{"url":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"},' +
            '"urlTemplate":"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"}').deep_symbolize_keys,
          kind: 'tiled',
          widgets: [
            {
              options: {
                aggregation: "count",
                aggregation_column: "category_t"
              },
              title: "Category category_t",
              type: "category"
            }
          ]
        },
        {
          options: JSON.parse('{"attribution":"CartoDB <a href=\"http://cartodb.com/attributions\" ' +
            'target=\"_blank\">attribution</a>","type":"CartoDB","active":true,"query":"","opacity":0.99,' +
            '"interactivity":"cartodb_id","interaction":true,"debug":false,"tiler_domain":"localhost.lan",' +
            '"tiler_port":"80","tiler_protocol":"http","sql_api_domain":"cartodb.com","sql_api_port":"80",' +
            '"sql_api_protocol":"http","extra_params":{"cache_policy":"persist","cache_buster":1459849314400},' +
            '"cdn_url":null,"maxZoom":28,"auto_bound":false,"visible":true,"sql_domain":"localhost.lan",' +
            '"sql_port":"80","sql_protocol":"http","tile_style_history":["#guess_ip_1 {\n  marker-fill: #FF6600;\n  ' +
            'marker-opacity: 0.9;\n  marker-width: 12;\n  marker-line-color: white;\n  marker-line-width: 3;\n  ' +
            'marker-line-opacity: 0.9;\n  marker-placement: point;\n  marker-type: ellipse;\n  ' +
            'marker-allow-overlap: true;\n}"],"style_version":"2.1.1","table_name":"guess_ip_1",' +
            '"user_name":"juanignaciosl","tile_style":"/** simple visualization */\n\n#guess_ip_1{\n  ' +
            'marker-fill-opacity: 0.9;\n  marker-line-color: #FFF;\n  marker-line-width: 1;\n  ' +
            'marker-line-opacity: 1;\n  marker-placement: point;\n  marker-type: ellipse;\n  marker-width: 10;\n  ' +
            'marker-fill: #FF6600;\n  marker-allow-overlap: true;\n}","id":"dbb6826a-09e5-4238-b81b-86a43535bf02",' +
            '"order":1,"use_server_style":true,"query_history":[],"stat_tag":"9e82a99a-fb12-11e5-80c0-080027880ca6",' +
            '"maps_api_template":"http://{user}.localhost.lan:8181","cartodb_logo":false,"no_cdn":false,' +
            '"force_cors":true,"tile_style_custom":false,"query_wrapper":null,"query_generated":false,' +
            '"wizard_properties":{"type":"polygon","properties":{"marker-width":10,"marker-fill":"#FF6600",' +
            '"marker-opacity":0.9,"marker-allow-overlap":true,"marker-placement":"point","marker-type":"ellipse",' +
            '"marker-line-width":1,"marker-line-color":"#FFF","marker-line-opacity":1,"marker-comp-op":"none",' +
            '"text-name":"None","text-face-name":"DejaVu Sans Book","text-size":10,"text-fill":"#000",' +
            '"text-halo-fill":"#FFF","text-halo-radius":1,"text-dy":-10,"text-allow-overlap":true,' +
            '"text-placement-type":"dummy","text-label-position-tolerance":0,"text-placement":"point",' +
            '"geometry_type":"point"}},"legend":{"type":"none","show_title":false,"title":"","template":"",' +
            '"visible":true}}').deep_symbolize_keys,
          kind: 'carto',
          infowindow: JSON.parse('{"fields":[],"template_name":"table/views/infowindow_light","template":"",' +
            '"alternative_names":{},"width":226,"maxHeight":180}').deep_symbolize_keys,
          tooltip: JSON.parse('{"fields":[],"template_name":"tooltip_light","template":"","alternative_names":{},' +
            '"maxHeight":180}').deep_symbolize_keys,
          active_layer: true
        },
        {
          options: JSON.parse('{"default":true,' +
            '"url":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", ' +
            '"subdomains":"abcd","minZoom":"0","maxZoom":"18","attribution":"\u00a9 <a ' +
            'href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 ' +
            '<a href=\"http://cartodb.com/attributions#basemaps\">CartoDB</a>",' +
            '"urlTemplate":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png","type":"Tiled",' +
            '"name":"Positron Labels"}').deep_symbolize_keys,
          kind: 'tiled'
        }
      ],
      overlays: [
        {
          options: JSON.parse('{"display":true,"x":20,"y":20}').deep_symbolize_keys,
          type: 'share'
        },
        {
          options: JSON.parse('{"display":true,"x":20,"y":150}').deep_symbolize_keys,
          type: 'loader',
          template: '<div class="loader" original-title=""></div>'
        }
      ],
      analyses: [
        { analysis_definition: { id: 'a1', type: 'source' } }
      ]
    }
  end

  CHANGING_LAYER_OPTIONS_KEYS = [:user_name, :id, :stat_tag].freeze

  def verify_visualization_vs_export(visualization, visualization_export, importing_user: nil)
    visualization.name.should eq visualization_export[:name]
    visualization.description.should eq visualization_export[:description]
    visualization.type.should eq visualization_export[:type]
    visualization.tags.should eq visualization_export[:tags]
    visualization.privacy.should eq visualization_export[:privacy]
    visualization.source.should eq visualization_export[:source]
    visualization.license.should eq visualization_export[:license]
    visualization.title.should eq visualization_export[:title]
    visualization.kind.should eq visualization_export[:kind]
    visualization.attributions.should eq visualization_export[:attributions]
    visualization.bbox.should eq visualization_export[:bbox]
    visualization.display_name.should eq visualization_export[:display_name]

    visualization.encrypted_password.should be_nil
    visualization.password_salt.should be_nil
    visualization.locked.should be_false

    verify_map_vs_export(visualization.map, visualization_export[:map])

    layers_export = visualization_export[:layers]

    verify_layers_vs_export(visualization.layers, layers_export, importing_user: importing_user)

    active_layer_order = layers_export.index { |l| l[:active_layer] }
    visualization.active_layer.should_not be_nil
    visualization.active_layer.order.should eq active_layer_order
    visualization.active_layer.id.should eq visualization.layers.find { |l| l.order == active_layer_order }.id

    verify_overlays_vs_export(visualization.overlays, visualization_export[:overlays])

    verify_analyses_vs_export(visualization.analyses, visualization_export[:analyses])
  end

  def verify_map_vs_export(map, map_export)
    map.provider.should eq map_export[:provider]
    map.bounding_box_sw.should eq map_export[:bounding_box_sw]
    map.bounding_box_ne.should eq map_export[:bounding_box_ne]
    map.center.should eq map_export[:center]
    map.zoom.should eq map_export[:zoom]
    map.view_bounds_sw.should eq map_export[:view_bounds_sw]
    map.view_bounds_ne.should eq map_export[:view_bounds_ne]
    map.scrollwheel.should eq map_export[:scrollwheel]
    map.legends.should eq map_export[:legends]
  end

  def verify_layers_vs_export(layers, layers_export, importing_user: nil)
    layers.should_not be_nil
    layers.length.should eq layers_export.length
    (0..(layers_export.length - 1)).each do |i|
      layer = layers[i]
      layer.order.should eq i

      verify_layer_vs_export(layer, layers_export[i], importing_user: importing_user)
    end
  end

  def verify_layer_vs_export(layer, layer_export, importing_user: nil)
    layer_options = layer.options.deep_symbolize_keys
    options_match = layer_options.reject { |k, _| CHANGING_LAYER_OPTIONS_KEYS.include?(k) }
    layer_export_options = layer_export[:options].deep_symbolize_keys
    export_options_match = layer_export_options.reject { |k, _| CHANGING_LAYER_OPTIONS_KEYS.include?(k) }
    options_match.should eq export_options_match

    if importing_user && layer_export_options.has_key?(:user_name)
      layer_options[:user_name].should eq importing_user.username
    else
      layer_options.has_key?(:user_name).should eq layer_export_options.has_key?(:user_name)
      layer_options[:user_name].should be_nil
    end

    if importing_user && layer_export_options.has_key?(:id)
      # Persisted layer
      layer_options[:id].should_not be_nil
      layer_options[:id].should eq layer.id
    else
      layer_options.has_key?(:id).should eq layer_export_options.has_key?(:id)
      layer_options[:id].should be_nil
    end

    if importing_user && layer_export_options.has_key?(:stat_tag)
      # Persisted layer
      layer_options[:stat_tag].should_not be_nil
      layer_options[:stat_tag].should eq layer.maps.first.visualizations.first.id
    else
      layer_options.has_key?(:stat_tag).should eq layer_export_options.has_key?(:stat_tag)
      layer_options[:stat_tag].should be_nil
    end

    layer.kind.should eq layer_export[:kind]

    if layer.infowindow
      layer.infowindow.deep_symbolize_keys.should eq layer_export[:infowindow].deep_symbolize_keys
    else
      layer.infowindow.should eq layer_export[:infowindow]
    end

    if layer.tooltip
      layer.tooltip.deep_symbolize_keys.should eq layer_export[:tooltip].deep_symbolize_keys
    else
      layer.tooltip.should eq layer_export[:tooltip]
    end

    verify_widgets_vs_export(layer.widgets, layer_export[:widgets])
  end

  def verify_widgets_vs_export(widgets, widgets_export)
    widgets_export_length = widgets_export.nil? ? 0 : widgets_export.length
    widgets.length.should eq widgets_export_length
    (0..(widgets_export_length - 1)).each do |i|
      widget = widgets[i]
      widget.order.should eq i

      verify_widget_vs_export(widget, widgets_export[i])
    end
  end

  def verify_widget_vs_export(widget, widget_export)
    widget.type.should eq widget_export[:type]
    widget.title.should eq widget_export[:title]
    widget.options_json.should eq widget_export[:options]
    widget.layer.should_not be_nil
  end

  def verify_analyses_vs_export(analyses, analyses_export)
    analyses.should_not be_nil
    analyses.length.should eq analyses_export.length
    (0..(analyses_export.length - 1)).each do |i|
      verify_analysis_vs_export(analyses[i], analyses_export[i])
    end
  end

  def verify_analysis_vs_export(analysis, analysis_export)
    analysis.analysis_definition_json.should eq analysis_export[:analysis_definition]
  end

  def verify_overlays_vs_export(overlays, overlays_export)
    overlays.should_not be_nil
    overlays.length.should eq overlays_export.length
    (0..(overlays_export.length - 1)).each do |i|
      overlay = overlays[i]
      verify_overlay_vs_export(overlay, overlays_export[i])
    end
  end

  def verify_overlay_vs_export(overlay, overlay_export)
    overlay.options.deep_symbolize_keys.should eq overlay_export[:options].deep_symbolize_keys
    overlay.type.should eq overlay_export[:type]
    overlay.template.should eq overlay_export[:template]
  end

  before(:all) do
    @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
    @no_private_maps_user = FactoryGirl.create(:carto_user, private_maps_enabled: false)
  end

  after(:all) do
    ::User[@user.id].destroy
    ::User[@no_private_maps_user.id].destroy
  end

  describe 'importing' do
    describe '#build_visualization_from_json_export' do
      it 'fails if version is not 2' do
        expect {
          Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.merge(version: 1).to_json)
        }.to raise_error("Wrong export version")
      end

      it 'builds base visualization' do
        visualization = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization_export = export[:visualization]
        verify_visualization_vs_export(visualization, visualization_export)

        visualization.id.should be_nil # Not set until persistence
        visualization.user_id.should be_nil # Import build step is "user-agnostic"
        visualization.created_at.should be_nil # Not set until persistence
        visualization.updated_at.should be_nil # Not set until persistence

        map = visualization.map
        map.id.should be_nil # Not set until persistence
        map.updated_at.should be_nil # Not set until persistence
        map.user_id.should be_nil # Import build step is "user-agnostic"

        visualization.layers.each do |layer|
          layer.updated_at.should be_nil
          layer.id.should be_nil
        end

        visualization.analyses.each do |analysis|
          analysis.id.should be_nil
          analysis.visualization_id.should eq visualization.id
          analysis.user_id.should be_nil
          analysis.created_at.should be_nil
          analysis.updated_at.should be_nil
        end
      end

      it 'builds base visualization that can be persisted by VisualizationsExportPersistenceService' do
        json_export = export.to_json
        imported_viz = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(json_export)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported_viz)
        # Let's make sure everything is persisted
        visualization = Carto::Visualization.find(visualization.id)

        visualization_export = export[:visualization]
        verify_visualization_vs_export(visualization, visualization_export, importing_user: @user)

        visualization.id.should_not be_nil
        visualization.user_id.should eq @user.id
        visualization.created_at.should_not be_nil
        visualization.updated_at.should_not be_nil

        map = visualization.map
        map.id.should_not be_nil
        map.updated_at.should_not be_nil
        map.user_id.should eq @user.id

        visualization.layers.each do |layer|
          layer.updated_at.should_not be_nil
          layer.id.should_not be_nil
        end

        visualization.analyses.each do |analysis|
          analysis.id.should_not be_nil
          analysis.user_id.should_not be_nil
          analysis.created_at.should_not be_nil
          analysis.updated_at.should_not be_nil
        end
      end

      it 'is backwards compatible with old models' do
        json_export = export.to_json
        imported_viz = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(json_export)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported_viz)
        # Let's make sure everything is persisted
        visualization = CartoDB::Visualization::Member.new(id: visualization.id).fetch

        # We've found some issues with json serialization that makes `public`
        visualization.map.layers.map do |layer|
          layer.public_values.should_not be_nil
        end
      end

      it 'imports private maps as public for users that have not private maps' do
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        visualization.privacy.should eq Carto::Visualization::PRIVACY_PRIVATE

        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@no_private_maps_user, imported)
        visualization.privacy.should eq Carto::Visualization::PRIVACY_PUBLIC
      end

      it "Doesn't register layer tables dependencies if user table doesn't exist" do
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        layer_with_table = visualization.layers.find { |l| l.options[:table_name].present? }
        layer_with_table.should_not be_nil
        layer_with_table.affected_tables.should be_empty
      end

      it "Register layer tables dependencies if user table exists" do
        user_table = FactoryGirl.create(:carto_user_table, user_id: @user.id, name: "guess_ip_1")
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        layer_with_table = visualization.layers.find { |l| l.options[:table_name].present? }
        layer_with_table.should_not be_nil
        layer_with_table.affected_tables.should_not be_empty
        layer_with_table.affected_tables.first.id.should eq user_table.id
      end
    end
  end

  describe 'exporting' do
    describe '#export_visualization_json_string' do
      include Carto::Factories::Visualizations

      before(:all) do
        @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
        @analysis = FactoryGirl.create(:source_analysis, visualization: @visualization, user: @user)
      end

      after(:all) do
        @analysis.destroy
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
        # This avoids connection leaking.
        ::User[@user.id].destroy
      end

      describe 'visualization types' do
        before(:all) do
          @table_visualization = FactoryGirl.create(:carto_visualization, type: 'table')
          @remote_visualization = FactoryGirl.create(:carto_visualization, type: 'remote')
        end

        after(:all) do
          @table_visualization.destroy
          @remote_visualization.destroy
        end

        it 'fails for visualizations that are not derived' do
          exporter = Carto::VisualizationsExportService2.new
          expect {
            exporter.export_visualization_json_hash(@table_visualization.id)
          }.to raise_error("Only derived visualizations can be exported")
          expect {
            exporter.export_visualization_json_hash(@remote_visualization.id)
          }.to raise_error("Only derived visualizations can be exported")
        end
      end

      it 'exports visualization' do
        exported_json = Carto::VisualizationsExportService2.new.export_visualization_json_hash(@visualization.id)

        exported_json[:version].split('.')[0].to_i.should eq 2

        exported_visualization = exported_json[:visualization]

        verify_visualization_vs_export(@visualization, exported_visualization)
      end
    end
  end

  describe 'exporting + importing' do
    include Carto::Factories::Visualizations

    def verify_visualizations_match(imported_visualization, original_visualization, importing_user: nil)
      imported_visualization.name.should eq original_visualization.name
      imported_visualization.description.should eq original_visualization.description
      imported_visualization.type.should eq original_visualization.type
      imported_visualization.tags.should eq original_visualization.tags
      imported_visualization.privacy.should eq original_visualization.privacy
      imported_visualization.source.should eq original_visualization.source
      imported_visualization.license.should eq original_visualization.license
      imported_visualization.title.should eq original_visualization.title
      imported_visualization.kind.should eq original_visualization.kind
      imported_visualization.attributions.should eq original_visualization.attributions
      imported_visualization.bbox.should eq original_visualization.bbox
      imported_visualization.display_name.should eq original_visualization.display_name

      verify_maps_match(imported_visualization.map, original_visualization.map)

      imported_layers = imported_visualization.layers
      original_layers = original_visualization.layers

      verify_layers_match(imported_layers, original_layers, importing_user: importing_user)

      imported_active_layer = imported_visualization.active_layer
      imported_active_layer.should_not be_nil
      active_layer_order = original_visualization.active_layer.order
      imported_active_layer.order.should eq active_layer_order
      imported_active_layer.id.should eq imported_layers.find_by_order(active_layer_order).id

      verify_overlays_match(imported_visualization.overlays, original_visualization.overlays)

      verify_analyses_match(imported_visualization.analyses, original_visualization.analyses)
    end

    def verify_maps_match(imported_map, original_map)
      imported_map.provider.should eq original_map.provider
      imported_map.bounding_box_sw.should eq original_map.bounding_box_sw
      imported_map.bounding_box_ne.should eq original_map.bounding_box_ne
      imported_map.center.should eq original_map.center
      imported_map.zoom.should eq original_map.zoom
      imported_map.view_bounds_sw.should eq original_map.view_bounds_sw
      imported_map.view_bounds_ne.should eq original_map.view_bounds_ne
      imported_map.scrollwheel.should eq original_map.scrollwheel
      imported_map.legends.should eq original_map.legends
    end

    def verify_layers_match(imported_layers, original_layers, importing_user: nil)
      imported_layers.should_not be_nil
      imported_layers.length.should eq original_layers.length
      (0..(original_layers.length - 1)).each do |i|
        layer = imported_layers[i]
        layer.order.should eq i

        verify_layer_match(layer, original_layers[i], importing_user: importing_user)
      end
    end

    def verify_layer_match(imported_layer, original_layer, importing_user: nil)
      imported_layer_options = imported_layer.options.deep_symbolize_keys
      imported_options_match = imported_layer_options.reject { |k, _| CHANGING_LAYER_OPTIONS_KEYS.include?(k) }
      original_layer_options = original_layer.options.deep_symbolize_keys
      original_options_match = original_layer_options.reject { |k, _| CHANGING_LAYER_OPTIONS_KEYS.include?(k) }
      imported_options_match.should eq original_options_match

      if importing_user && original_layer_options.has_key?(:user_name)
        imported_layer_options[:user_name].should_not be_nil
        imported_layer_options[:user_name].should eq importing_user.username
      else
        imported_layer_options.has_key?(:user_name).should eq original_layer_options.has_key?(:user_name)
        imported_layer_options[:user_name].should be_nil
      end

      if importing_user && original_layer_options.has_key?(:id)
        # Persisted layer
        imported_layer_options[:id].should_not be_nil
        imported_layer_options[:id].should eq imported_layer.id
      else
        imported_layer_options.has_key?(:id).should eq original_layer_options.has_key?(:id)
        imported_layer_options[:id].should be_nil
      end

      if importing_user && original_layer_options.has_key?(:stat_tag)
        # Persisted layer
        imported_layer_options[:stat_tag].should_not be_nil
        imported_layer_options[:stat_tag].should eq imported_layer.maps.first.visualizations.first.id
      else
        imported_layer_options.has_key?(:stat_tag).should eq original_layer_options.has_key?(:stat_tag)
        imported_layer_options[:stat_tag].should be_nil
      end

      imported_layer.kind.should eq original_layer.kind
      imported_layer.infowindow.should eq original_layer.infowindow
      imported_layer.tooltip.should eq original_layer.tooltip

      verify_widgets_match(imported_layer.widgets, original_layer.widgets)
    end

    def verify_widgets_match(imported_widgets, original_widgets)
      original_widgets_length = original_widgets.nil? ? 0 : original_widgets.length
      imported_widgets.length.should eq original_widgets_length
      (0..(original_widgets_length - 1)).each do |i|
        imported_widget = imported_widgets[i]
        imported_widget.order.should eq i

        verify_widget_match(imported_widget, original_widgets[i])
      end
    end

    def verify_widget_match(imported_widget, original_widget)
      imported_widget.type.should eq original_widget.type
      imported_widget.title.should eq original_widget.title
      imported_widget.options_json.should eq original_widget.options
      imported_widget.layer.should_not be_nil
    end

    def verify_analyses_match(imported_analyses, original_analyses)
      imported_analyses.should_not be_nil
      imported_analyses.length.should eq original_analyses.length
      (0..(imported_analyses.length - 1)).each do |i|
        verify_analysis_match(imported_analyses[i], original_analyses[i])
      end
    end

    def verify_analysis_match(imported_analysis, original_analysis)
      imported_analysis.analysis_definition_json.should eq original_analysis.analysis_definition_json
    end

    def verify_overlays_match(imported_overlays, original_overlays)
      imported_overlays.should_not be_nil
      imported_overlays.length.should eq original_overlays.length
      (0..(imported_overlays.length - 1)).each do |i|
        imported_overlay = imported_overlays[i]
        imported_overlay.order.should eq (i + 1)
        verify_overlay_match(imported_overlay, original_overlays[i])
      end
    end

    def verify_overlay_match(imported_overlay, original_overlay)
      imported_overlay.options.should eq original_overlay.options
      imported_overlay.type.should eq original_overlay.type
      imported_overlay.template.should eq original_overlay.template
    end

    before(:all) do
      @user = FactoryGirl.create(:carto_user, private_maps_enabled: true)
      @user2 = FactoryGirl.create(:carto_user, private_maps_enabled: true)
    end

    after(:all) do
      # This avoids connection leaking.
      ::User[@user.id].destroy
      ::User[@user2.id].destroy
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      carto_layer = @visualization.layers.find { |l| l.kind == 'carto' }
      carto_layer.options[:user_name] = @user.username
      carto_layer.save
      @analysis = FactoryGirl.create(:source_analysis, visualization: @visualization, user: @user)
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
    end

    it 'imports an exported visualization should create a new visualization with matching metadata' do
      exported_string = Carto::VisualizationsExportService2.new.export_visualization_json_string(@visualization.id)
      built_viz = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(exported_string)
      imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz)

      imported_viz = Carto::Visualization.find(imported_viz.id)
      verify_visualizations_match(imported_viz, @visualization, importing_user: @user)
    end

    it 'imports an exported visualization into another account should change layer user_name option' do
      exported_string = Carto::VisualizationsExportService2.new.export_visualization_json_string(@visualization.id)
      built_viz = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(exported_string)
      imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

      imported_viz = Carto::Visualization.find(imported_viz.id)
      verify_visualizations_match(imported_viz, @visualization, importing_user: @user2)
    end
  end
end
