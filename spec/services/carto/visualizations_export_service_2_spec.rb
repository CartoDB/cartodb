require 'spec_helper_min'

describe Carto::VisualizationsExportService2 do
  include NamedMapsHelper

  before(:each) do
    bypass_named_maps
  end

  let(:export) do
    {
      visualization: mapcapped_visualization_export,
      version: '2.1.1'
    }
  end

  let(:mapcapped_visualization_export) do
    mapcap = {
      ids_json: {
        visualization_id: "04e0ddac-bea8-4e79-a362-f06b9a7396cf",
        map_id: "bf727caa-f05a-45df-baa5-c29cb4542ecd",
        layers: [
          { layer_id: "c2be46d2-d44e-49fa-a604-8814fcd150f7", widgets: [] },
          { layer_id: "dd1a006b-5791-4221-b120-4b9e1f2e93e7", widgets: [] },
          { layer_id: "f4a9823b-8de2-474f-bcc0-8b230f881a75", widgets: ["b5dcb89b-0c4a-466c-b459-cc5c8053f4ec"] },
          { layer_id: "4ffea696-e127-40bc-90cf-9e34b9a77d89", widgets: [] }
        ]
      },
      export_json: {
        visualization: base_visualization_export,
        version: '2.1.1'
      }
    }

    base_visualization_export.merge(mapcap: mapcap)
  end

  def base_visualization_export
    {
      id: '138110e4-7425-4978-843d-d7307bd70d1c',
      name: 'the name',
      description: 'the description',
      version: 3,
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
      state: { json: { manolo: 'escobar' } },
      display_name: 'the display_name',
      uses_vizjson2: true,
      locked: false,
      map: {
        provider: 'leaflet',
        bounding_box_sw: '[-85.0511, -179]',
        bounding_box_ne: '[85.0511, 179]',
        center: '[34.672410587, 67.90919030050006]',
        zoom: 1,
        view_bounds_sw: '[15.775376695, -18.1672257149999]',
        view_bounds_ne: '[53.569444479, 153.985606316]',
        scrollwheel: false,
        legends: true,
        options: {
          legends: false,
          scrollwheel: true,
          layer_selector: false,
          dashboard_menu: false
        }
      },
      layers: [
        {
          options: JSON.parse('{"default":true,' +
            '"url":"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",' +
            '"subdomains":"abcd","minZoom":"0","maxZoom":"18","name":"Positron",' +
            '"className":"positron_rainbow_labels","attribution":"\u00a9 <a ' +
            'href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 ' +
            '<a href=\"https://carto.com/attributions\">CARTO</a>",' +
            '"labels":{"url":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"},' +
            '"urlTemplate":"http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"}').deep_symbolize_keys,
          kind: 'tiled'
        },
        {
          options: JSON.parse('{"attribution":"CARTO <a href=\"https://carto.com/attributions\" ' +
            'target=\"_blank\">attribution</a>","type":"CartoDB","active":true,"query":"","opacity":0.99,' +
            '"interactivity":"cartodb_id","interaction":true,"debug":false,"tiler_domain":"localhost.lan",' +
            '"tiler_port":"80","tiler_protocol":"http","sql_api_domain":"carto.com","sql_api_port":"80",' +
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
          options: JSON.parse('{"attribution":"CARTO <a href=\"http://carto.com/attributions\" ' +
            'target=\"_blank\">attribution</a>","type":"CartoDB","active":true,"query":"","opacity":0.99,' +
            '"interactivity":"cartodb_id","interaction":true,"debug":false,"tiler_domain":"localhost.lan",' +
            '"tiler_port":"80","tiler_protocol":"http","sql_api_domain":"carto.com","sql_api_port":"80",' +
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
          widgets: [
            {
              options: {
                aggregation: "count",
                aggregation_column: "category_t"
              },
              style: {
                widget_style: {
                  definition: {
                    fill: { color: { fixed: '#FFF' } }
                  }
                },
                auto_style: {
                  definition: {
                    fill: { color: { fixed: '#FFF' } }
                  }
                }
              },
              title: "Category category_t",
              type: "category",
              source_id: "a1",
              order: 1
            }
          ],
          legends: [
            {
              type: 'custom',
              title: 'the best legend on planet earth',
              pre_html: '<h1>Here it comes!</h1>',
              post_html: '<h2>Awesome right?</h2>',
              definition: {
                categories: [
                  {
                    title: 'foo',
                    color: '#fabada'
                  },
                  {
                    title: 'bar',
                    icon: 'super.png',
                    color: '#fabada'
                  },
                  {
                    title: 'ber'
                  },
                  {
                    title: 'baz'
                  },
                  {
                    title: 'bars',
                    icon: 'dupe.png',
                    color: '#fabada'
                  },
                  {
                    title: 'fooz',
                    color: '#fabada'
                  }
                ]
              }
            },
            {
              type: 'bubble',
              title: 'the second best legend on planet earth',
              pre_html: '<h1>Here it comes!</h1>',
              post_html: '<h2>Awesome right? But not so much</h2>',
              definition: {
                color: '#abc'
              }
            }
          ],
          infowindow: JSON.parse('{"fields":[],"template_name":"table/views/infowindow_light","template":"",' +
            '"alternative_names":{},"width":226,"maxHeight":180}').deep_symbolize_keys,
          tooltip: JSON.parse('{"fields":[],"template_name":"tooltip_light","template":"","alternative_names":{},' +
            '"maxHeight":180}').deep_symbolize_keys
        },
        {
          options: JSON.parse('{"default":true,' +
            '"url":"http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png", ' +
            '"subdomains":"abcd","minZoom":"0","maxZoom":"18","attribution":"\u00a9 <a ' +
            'href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors \u00a9 ' +
            '<a href=\"https://carto.com/attributions\">CARTO</a>",' +
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
      ],
      user: { username: 'juanignaciosl' },
      permission: { access_control_list: [] },
      synchronization: nil,
      user_table: nil,
      created_at: DateTime.now,
      updated_at: DateTime.now
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
    visualization.version.should eq visualization_export[:version]

    verify_state_vs_export(visualization.state, visualization_export[:state])

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

    verify_mapcap_vs_export(visualization.latest_mapcap, visualization_export[:mapcap])
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

    map_options = map.options.with_indifferent_access
    map_options.should eq map_export[:options].with_indifferent_access
  end

  def verify_state_vs_export(state, state_export)
    state_export_json = state_export[:json] if state_export
    state_export_json ||= {}

    state.json.should eq state_export_json
  end

  def verify_mapcap_vs_export(mapcap, mapcap_export)
    return true if mapcap.nil? && mapcap_export.nil?

    deep_symbolize(mapcap.try(:ids_json)).should eq deep_symbolize(mapcap_export[:ids_json])
    deep_symbolize(mapcap.try(:export_json)).should eq deep_symbolize(mapcap_export[:export_json])
    mapcap.try(:created_at).should eq mapcap_export[:created_at]
  end

  def deep_symbolize(h)
    JSON.parse(JSON.dump(h), symbolize_names: true)
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
      layer_options[:stat_tag].should eq layer.maps.first.visualization.id
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
    verify_legends_vs_export(layer.legends, layer_export[:legends])
  end

  def verify_widgets_vs_export(widgets, widgets_export)
    widgets_export_length = widgets_export.nil? ? 0 : widgets_export.length
    widgets.length.should eq widgets_export_length
    (0..(widgets_export_length - 1)).each do |i|
      verify_widget_vs_export(widgets[i], widgets_export[i])
    end
  end

  def verify_widget_vs_export(widget, widget_export)
    widget.type.should eq widget_export[:type]
    widget.title.should eq widget_export[:title]
    widget.options.symbolize_keys.should eq widget_export[:options]
    widget.layer.should_not be_nil
    widget.source_id.should eq widget_export[:source_id]
    widget.order.should eq widget_export[:order]
    widget.style.should eq widget_export[:style]
  end

  def verify_legends_vs_export(legends, legends_export)
    legends.each_with_index do |legend, index|
      legend_presentation = {
        definition: JSON.parse(JSON.dump(legend.definition), symbolize_names: true), # Recursive symbolize, with arrays
        post_html: legend.post_html,
        pre_html: legend.pre_html,
        title: legend.title,
        type: legend.type
      }

      legend_presentation.should eq legends_export[index]
    end
  end

  def verify_analyses_vs_export(analyses, analyses_export)
    analyses.should_not be_nil
    analyses.length.should eq analyses_export.length
    (0..(analyses_export.length - 1)).each do |i|
      verify_analysis_vs_export(analyses[i], analyses_export[i])
    end
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

  def verify_analysis_vs_export(analysis, analysis_export)
    clean_analysis_definition(analysis.analysis_definition.deep_symbolize_keys).should eq clean_analysis_definition(analysis_export[:analysis_definition].deep_symbolize_keys)
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
    bypass_named_maps
    ::User[@user.id].destroy
    ::User[@no_private_maps_user.id].destroy
  end

  describe 'importing' do
    include Carto::Factories::Visualizations
    it 'imports synchronization with missing log' do
      @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
      FactoryGirl.create(:carto_synchronization, visualization: @visualization)

      @visualization.synchronization.log.destroy
      @visualization.synchronization.reload
      visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, @visualization)

      visualization.should be
    end

    describe '#build_visualization_from_json_export' do
      include Carto::Factories::Visualizations

      it 'fails if version is not 2' do
        expect {
          Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.merge(version: 1).to_json)
        }.to raise_error("Wrong export version")
      end

      it 'builds base visualization' do
        visualization = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization_export = export[:visualization]
        verify_visualization_vs_export(visualization, visualization_export)

        visualization.id.should eq visualization_export[:id]
        visualization.user_id.should be_nil # Import build step is "user-agnostic"

        visualization.state.id.should be_nil

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
        visualization_export.delete(:mapcap) # Not imported here
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

      it 'builds base vis with symbols in name that can be persisted by VisualizationsExportPersistenceService' do
        export_hash = export
        export_hash[:visualization][:name] = %{A name' with" special!"·$% symbols&/()"}
        json_export = export_hash.to_json
        json_export
        imported_viz = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(json_export)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported_viz)
        # Let's make sure everything is persisted
        visualization = Carto::Visualization.find(visualization.id)

        visualization_export = export[:visualization]
        visualization_export.delete(:mapcap) # Not imported here
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

      it 'imports protected maps as private' do
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        imported.privacy = Carto::Visualization::PRIVACY_PROTECTED
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        visualization.privacy.should eq Carto::Visualization::PRIVACY_PRIVATE
      end

      it 'imports protected maps as public if the user does not have private maps enabled' do
        @user.stubs(:private_maps_enabled).returns(false)
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        imported.privacy = Carto::Visualization::PRIVACY_PROTECTED
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        visualization.privacy.should eq Carto::Visualization::PRIVACY_PUBLIC
      end

      it 'does not import more layers than the user limit' do
        old_max_layers = @user.max_layers
        @user.max_layers = 1
        @user.save

        begin
          imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
          tiled_layers_count = imported.layers.select { |l| ['tiled'].include?(l.kind) }.count
          tiled_layers_count.should eq 2
          imported.layers.select { |l| ['carto', 'torque'].include?(l.kind) }.count.should > @user.max_layers

          visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
          visualization.layers.select { |l| ['tiled'].include?(l.kind) }.count.should eq tiled_layers_count
          visualization.layers.select { |l| ['carto', 'torque'].include?(l.kind) }.count.should eq @user.max_layers

          destroy_visualization(visualization.id)
        ensure
          @user.max_layers = old_max_layers
          @user.save
        end
      end

      it "Doesn't register layer tables dependencies if user table doesn't exist" do
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        layer_with_table = visualization.layers.find { |l| l.options[:table_name].present? }
        layer_with_table.should_not be_nil
        layer_with_table.user_tables.should be_empty
      end

      it "Register layer tables dependencies if user table exists" do
        user_table = FactoryGirl.create(:carto_user_table, user_id: @user.id, name: "guess_ip_1")
        imported = Carto::VisualizationsExportService2.new.build_visualization_from_json_export(export.to_json)
        visualization = Carto::VisualizationsExportPersistenceService.new.save_import(@user, imported)
        layer_with_table = visualization.layers.find { |l| l.options[:table_name].present? }
        layer_with_table.should_not be_nil
        layer_with_table.user_tables.should_not be_empty
        layer_with_table.user_tables.first.id.should eq user_table.id
      end

      describe 'maintains backwards compatibility with' do
        describe '2.1.1' do
          it 'defaults to locked visualizations' do
            export_2_1_1 = export
            export_2_1_1[:visualization].delete(:locked)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_1_1.to_json)
            expect(visualization.locked).to eq(false)
          end

          it 'sets password protected visualizations to private' do
            export_2_1_1 = export
            export_2_1_1[:visualization][:privacy] = 'password'

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_1_1.to_json)
            imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, visualization)

            expect(visualization.privacy).to eq('private')
          end
        end

        describe '2.1.0' do
          it 'without mark_as_vizjson2' do
            export_2_1_0 = export
            export_2_1_0[:visualization].delete(:uses_vizjson2)

            service = Carto::VisualizationsExportService2.new
            expect(service.marked_as_vizjson2_from_json_export?(export_2_1_0.to_json)).to be_false
          end

          it 'without mapcap' do
            export_2_1_0 = export
            export_2_1_0[:visualization].delete(:mapcap)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_1_0.to_json)
            expect(visualization.mapcapped?).to be_false
          end

          it 'without dates' do
            export_2_1_0 = export
            export_2_1_0[:visualization].delete(:created_at)
            export_2_1_0[:visualization].delete(:updated_at)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_1_0.to_json)
            expect(visualization.created_at).to be_nil
            expect(visualization.updated_at).to be_nil
          end
        end

        it '2.0.9 (without permission, sync nor user_table)' do
          export_2_0_9 = export
          export_2_0_9[:visualization].delete(:synchronization)
          export_2_0_9[:visualization].delete(:user_table)
          export_2_0_9[:visualization].delete(:permission)

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_9.to_json)

          visualization.permission.should be_nil
          visualization.synchronization.should be_nil
        end

        it '2.0.8 (without id)' do
          export_2_0_8 = export
          export_2_0_8[:visualization].delete(:id)

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_8.to_json)

          visualization.id.should be_nil
        end

        it '2.0.7 (without Widget.style)' do
          export_2_0_7 = export
          export_2_0_7[:visualization][:layers].each do |layer|
            layer.fetch(:widgets, []).each { |widget| widget.delete(:style) }
          end

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_7.to_json)
          visualization.widgets.first.style.blank?.should be_true

          imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, visualization)
          imported_viz.widgets.first.style.should == {}
        end

        describe '2.0.6 (without map options)' do
          it 'missing options' do
            export_2_0_6 = export
            export_2_0_6[:visualization][:map].delete(:options)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_0_6.to_json)

            visualization.map.options.should be
          end

          it 'partial options' do
            export_2_0_6 = export
            export_2_0_6[:visualization][:map][:options].delete(:dashboard_menu)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_0_6.to_json)

            visualization.map.options[:dashboard_menu].should be
          end
        end

        it '2.0.5 (without version)' do
          export_2_0_5 = export
          export_2_0_5[:visualization].delete(:version)

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_5.to_json)

          visualization.version.should eq 2
        end

        it '2.0.4 (without Widget.order)' do
          export_2_0_4 = export
          export_2_0_4[:visualization][:layers].each do |layer|
            layer.fetch(:widgets, []).each { |widget| widget.delete(:order) }
          end

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_4.to_json)

          visualization_export = export_2_0_4[:visualization]
          visualization_export[:layers][2][:widgets][0][:order] = 0 # Should assign order 0 to the first widget
          verify_visualization_vs_export(visualization, visualization_export)
        end

        it '2.0.3 (without Layer.legends)' do
          export_2_0_3 = export
          export_2_0_3[:visualization][:layers].each do |layer|
            layer.delete(:legends)
          end

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_3.to_json)

          visualization_export = export_2_0_3[:visualization]
          verify_visualization_vs_export(visualization, visualization_export)
        end

        it '2.0.2 (without Visualization.state)' do
          export_2_0_2 = export
          export_2_0_2[:visualization].delete(:state)

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_2.to_json)

          visualization_export = export_2_0_2[:visualization]
          verify_visualization_vs_export(visualization, visualization_export)
        end

        describe '2.0.1 (without username)' do
          it 'when not renaming tables' do
            export_2_0_1 = export
            export_2_0_1[:visualization].delete(:user)

            service = Carto::VisualizationsExportService2.new
            visualization = service.build_visualization_from_json_export(export_2_0_1.to_json)

            visualization_export = export_2_0_1[:visualization]
            verify_visualization_vs_export(visualization, visualization_export)
          end

          it 'when renaming tables' do
            export_2_0_1 = export
            export_2_0_1.delete(:user)

            service = Carto::VisualizationsExportService2.new
            built_viz = service.build_visualization_from_json_export(export_2_0_1.to_json)
            Carto::VisualizationsExportPersistenceService.any_instance.stubs(:test_query).returns(true)
            Carto::AnalysisNode.any_instance.stubs(:test_query).returns(true)
            Carto::Layer.any_instance.stubs(:test_query).returns(true)
            imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz)
            imported_viz.layers[1].options[:user_name].should eq @user.username
          end
        end

        it '2.0.0 (without Widget.source_id)' do
          export_2_0_0 = export
          export_2_0_0[:visualization][:layers].each do |layer|
            if layer[:widgets]
              layer[:widgets].each { |widget| widget.delete(:source_id) }
            end
          end

          service = Carto::VisualizationsExportService2.new
          visualization = service.build_visualization_from_json_export(export_2_0_0.to_json)

          visualization_export = export_2_0_0[:visualization]
          verify_visualization_vs_export(visualization, visualization_export)
        end
      end
    end
  end

  describe 'exporting' do
    describe '#export_visualization_json_string' do
      include Carto::Factories::Visualizations

      before(:all) do
        bypass_named_maps
        @user = FactoryGirl.create(:carto_user, private_maps_enabled: true, private_tables_enabled: true)
        @user2 = FactoryGirl.create(:carto_user, private_maps_enabled: true)
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
        @analysis = FactoryGirl.create(:source_analysis, visualization: @visualization, user: @user)
      end

      after(:all) do
        @analysis.destroy
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
        # This avoids connection leaking.
        ::User[@user.id].destroy
        ::User[@user2.id].destroy
      end

      describe 'visualization types' do
        before(:all) do
          bypass_named_maps
          @remote_visualization = FactoryGirl.create(:carto_visualization, type: 'remote')
        end

        after(:all) do
          @remote_visualization.destroy
        end

        it 'works for derived/canonical/remote visualizations' do
          exporter = Carto::VisualizationsExportService2.new
          expect {
            exporter.export_visualization_json_hash(@table_visualization.id, @user)
          }.not_to raise_error
          expect {
            exporter.export_visualization_json_hash(@visualization.id, @user)
          }.not_to raise_error
          expect {
            exporter.export_visualization_json_hash(@remote_visualization.id, @user)
          }.not_to raise_error
        end
      end

      it 'exports visualization' do
        exported_json = Carto::VisualizationsExportService2.new.export_visualization_json_hash(@visualization.id, @user)

        exported_json[:version].split('.')[0].to_i.should eq 2

        exported_visualization = exported_json[:visualization]
        verify_visualization_vs_export(@visualization, exported_visualization)
      end

      it 'only exports layers that a user has permissions at' do
        map = FactoryGirl.create(:carto_map, user: @user)

        private_table = FactoryGirl.create(:private_user_table, user: @user)
        public_table = FactoryGirl.create(:public_user_table, user: @user)

        private_layer = FactoryGirl.create(:carto_layer, options: { table_name: private_table.name }, maps: [map])
        FactoryGirl.create(:carto_layer, options: { table_name: public_table.name }, maps: [map])

        map, table, table_visualization, visualization = create_full_visualization(@user,
                                                                                   map: map,
                                                                                   table: private_table,
                                                                                   data_layer: private_layer)

        exported_own = Carto::VisualizationsExportService2.new.export_visualization_json_hash(visualization.id, @user)
        own_layers = exported_own[:visualization][:layers]
        own_layers.count.should eq 2
        own_layers.map { |l| l[:options][:table_name] }.sort.should eq [private_table.name, public_table.name].sort

        exported_nown = Carto::VisualizationsExportService2.new.export_visualization_json_hash(visualization.id, @user2)
        nown_layers = exported_nown[:visualization][:layers]
        nown_layers.count.should eq 1
        nown_layers.map { |l| l[:options][:table_name] }.sort.should eq [public_table.name].sort

        destroy_full_visualization(map, table, table_visualization, visualization)
      end

      it 'truncates long sync logs' do
        FactoryGirl.create(:carto_synchronization, visualization: @table_visualization)
        @table_visualization.reload
        @table_visualization.synchronization.log.update_attribute(:entries, 'X' * 15000)
        export = Carto::VisualizationsExportService2.new.export_visualization_json_hash(@table_visualization.id, @user)
        expect(export[:visualization][:synchronization][:log][:entries].length).to be < 10000
      end
    end

    describe 'exporting + importing visualizations with shared tables' do
      include_context 'organization with users helper'
      include TableSharing
      include Carto::Factories::Visualizations
      include CartoDB::Factories

      before(:all) do
        @helper = TestUserFactory.new
        @org_user_with_dash_1 = @helper.create_test_user(unique_name('user-1-'), @organization)
        @org_user_with_dash_2 = @helper.create_test_user(unique_name('user-2-'), @organization)
        @carto_org_user_with_dash_1 = Carto::User.find(@org_user_with_dash_1.id)
        @carto_org_user_with_dash_2 = Carto::User.find(@org_user_with_dash_2.id)

        @normal_user = @helper.create_test_user(unique_name('n-user-1'))
        @carto_normal_user = Carto::User.find(@normal_user.id)
      end

      before(:each) do
        bypass_named_maps
        delete_user_data @org_user_with_dash_1
        delete_user_data @org_user_with_dash_2
        Carto::VisualizationsExportPersistenceService.any_instance.stubs(:test_query).returns(true)
        Carto::AnalysisNode.any_instance.stubs(:test_query).returns(true)
        Carto::Layer.any_instance.stubs(:test_query).returns(true)
      end

      let(:table_name) { 'a_shared_table' }

      def query(table, user = nil)
        if user.present?
          "SELECT * FROM #{user.sql_safe_database_schema}.#{table.name}"
        else
          "SELECT * FROM #{table.name}"
        end
      end

      def setup_visualization_with_layer_query(owner_user, shared_user)
        @map, @table, @table_visualization, @visualization = shared_table_viz_with_layer_query(owner_user, shared_user)
      end

      def shared_table_viz_with_layer_query(owner_user, shared_user)
        table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: table_name, user_id: owner_user.id)
        user_table = Carto::UserTable.find(table.id)
        share_table_with_user(table, shared_user)

        query1 = query(table, owner_user)
        layer_options = {
          table_name: table.name,
          query: query1,
          user_name: owner_user.username,
          query_history: [query1]
        }
        layer = FactoryGirl.create(:carto_layer, options: layer_options)
        layer.options['query'].should eq query1
        layer.options['user_name'].should eq owner_user.username
        layer.options['query_history'].should eq [query1]

        map = FactoryGirl.create(:carto_map, layers: [layer], user: owner_user)
        map, table, table_visualization, visualization = create_full_visualization(owner_user,
                                                                                       map: map,
                                                                                       table: user_table,
                                                                                       data_layer: layer)

        FactoryGirl.create(:source_analysis, visualization: visualization, user: owner_user,
                                             source_table: table.name, query: query1)
        return map, table, table_visualization, visualization
      end

      after(:each) do
        ::UserTable[@table.id].destroy if @table && ::UserTable[@table.id]
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      let(:export_service) { Carto::VisualizationsExportService2.new }

      def check_username_change(visualization, table, source_user, target_user)
        query1 = query(table, source_user)
        exported = export_service.export_visualization_json_hash(visualization.id, target_user)
        layers = exported[:visualization][:layers]
        layers.should_not be_nil
        layer = layers[0]
        layer[:options]['query'].should eq query1
        layer[:options]['user_name'].should eq source_user.username
        layer[:options]['query_history'].should eq [query1]

        built_viz = export_service.build_visualization_from_hash_export(exported)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(target_user, built_viz)
        imported_layer = imported_viz.layers[0]

        imported_layer[:options]['user_name'].should eq target_user.username

        analysis_definition = imported_viz.analyses.first.analysis_definition
        analysis_definition[:params][:query].should eq imported_layer[:options]['query']

        imported_layer[:options]['query']
      end

      it 'replaces owner name with new user name on import for user_name and query' do
        source_user = @carto_org_user_1
        target_user = @carto_org_user_2
        setup_visualization_with_layer_query(source_user, target_user)
        source_user.username.should_not include('-')
        check_username_change(@visualization, @table, source_user, target_user).should eq query(@table, target_user)
      end

      it 'replaces owner name (with dash) with new user name on import for user_name and query' do
        source_user = @carto_org_user_with_dash_1
        target_user = @carto_org_user_with_dash_2
        setup_visualization_with_layer_query(source_user, target_user)
        source_user.username.should include('-')
        check_username_change(@visualization, @table, source_user, target_user).should eq query(@table, target_user)
      end

      it 'replaces owner name (without dash) with new user name (with dash) on import for user_name and query' do
        source_user = @carto_org_user_1
        target_user = @carto_org_user_with_dash_2
        setup_visualization_with_layer_query(source_user, target_user)
        source_user.username.should_not include('-')
        target_user.username.should include('-')
        check_username_change(@visualization, @table, source_user, target_user).should eq query(@table, target_user)
      end

      it 'removes owner name from user_name and query importing into a non-organization account' do
        source_user = @carto_org_user_with_dash_1
        target_user = @carto_normal_user
        setup_visualization_with_layer_query(source_user, target_user)
        source_user.username.should include('-')
        check_username_change(@visualization, @table, source_user, target_user).should eq query(@table)
      end

      it 'removes owner name from user_name and query importing into a non-org. even if username matches' do
        name = 'wadus-user'
        org_user_same_name = @helper.create_test_user(name, @organization)
        source_user = Carto::User.find(org_user_same_name.id)
        target_user = @carto_org_user_1
        @map, @table, @table_visualization, @visualization = shared_table_viz_with_layer_query(source_user, target_user)

        query1 = query(@table, source_user)
        # Self export
        exported = export_service.export_visualization_json_hash(@visualization.id, source_user)
        layers = exported[:visualization][:layers]
        layers.should_not be_nil
        layer = layers[0]
        layer[:options]['query'].should eq query1
        layer[:options]['user_name'].should eq source_user.username
        layer[:options]['query_history'].should eq [query1]

        delete_user_data org_user_same_name
        org_user_same_name.destroy

        user_same_name = @helper.create_test_user(name)
        carto_user_same_name = Carto::User.find(user_same_name.id)

        built_viz = export_service.build_visualization_from_hash_export(exported)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(carto_user_same_name, built_viz)
        imported_layer = imported_viz.layers[0]

        imported_layer[:options]['user_name'].should eq user_same_name.username

        analysis_definition = imported_viz.analyses.first.analysis_definition
        analysis_definition[:params][:query].should eq imported_layer[:options]['query']

        imported_layer[:options]['query'].should eq query(@table)

        delete_user_data user_same_name
        user_same_name.destroy
      end

      it 'does not replace owner name with new user name on import when new query fails' do
        Carto::VisualizationsExportPersistenceService.any_instance.stubs(:test_query).returns(false)
        Carto::AnalysisNode.any_instance.stubs(:test_query).returns(false)
        Carto::Layer.any_instance.stubs(:test_query).returns(false)
        source_user = @carto_org_user_1
        target_user = @carto_org_user_2
        setup_visualization_with_layer_query(source_user, target_user)
        check_username_change(@visualization, @table, source_user, target_user).should eq query(@table, source_user)
      end
    end

    describe 'exporting + importing visualizations with renamed tables' do
      include Carto::Factories::Visualizations
      include CartoDB::Factories

      before(:all) do
        bypass_named_maps
        @user = FactoryGirl.create(:carto_user)
      end

      before(:each) do
        Carto::VisualizationsExportPersistenceService.any_instance.stubs(:test_query).returns(true)
        Carto::AnalysisNode.any_instance.stubs(:test_query).returns(true)
        Carto::Layer.any_instance.stubs(:test_query).returns(true)
      end

      def default_query(table_name = @table.name)
        if @user.present?
          "SELECT * FROM #{@user.sql_safe_database_schema}.#{table_name}"
        else
          "SELECT * FROM #{table_name}"
        end
      end

      def setup_visualization_with_layer_query(table_name, query = nil)
        @table = create_table(name: table_name, user_id: @user.id)
        user_table = Carto::UserTable.find(@table.id)

        query ||= default_query(table_name)
        layer_options = {
          table_name: @table.name,
          query: query,
          user_name: @user.username,
          query_history: [query]
        }
        layer = FactoryGirl.create(:carto_layer, options: layer_options)
        layer.options['query'].should eq query
        layer.options['user_name'].should eq @user.username
        layer.options['table_name'].should eq @table.name
        layer.options['query_history'].should eq [query]

        map = FactoryGirl.create(:carto_map, layers: [layer], user: @user)
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user,
                                                                                       map: map,
                                                                                       table: user_table,
                                                                                       data_layer: layer)
        FactoryGirl.create(:source_analysis, visualization: @visualization, user: @user,
                                             source_table: @table.name, query: query)
        FactoryGirl.create(:analysis_with_source, visualization: @visualization, user: @user,
                                                  source_table: @table.name, query: query)
      end

      after(:each) do
        ::UserTable[@table.id].destroy
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      let(:export_service) { Carto::VisualizationsExportService2.new }

      def import_and_check_query(renamed_tables, expected_table_name, expected_query = nil)
        exported = export_service.export_visualization_json_hash(@visualization.id, @user)

        built_viz = export_service.build_visualization_from_hash_export(exported)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz,
                                                                                     renamed_tables: renamed_tables)

        expected_query ||= default_query(expected_table_name)
        imported_layer_options = imported_viz.layers[0][:options]

        imported_layer_options['query'].should eq expected_query
        imported_layer_options['table_name'].should eq expected_table_name

        source_analysis = imported_viz.analyses.find { |a| a.analysis_node.source? }.analysis_definition
        check_analysis_defition(source_analysis, expected_table_name, expected_query)
        nested_analysis = imported_viz.analyses.find { |a| !a.analysis_node.source? }.analysis_definition
        check_analysis_defition(nested_analysis[:params][:source], expected_table_name, expected_query)
      end

      def check_analysis_defition(analysis_definition, expected_table_name, expected_query)
        analysis_definition[:options][:table_name].should eq expected_table_name
        analysis_definition[:params][:query].should eq expected_query
      end

      it 'replaces table name in default queries on import (with schema)' do
        setup_visualization_with_layer_query('tabula')
        renamed_tables = { 'tabula' => 'rasa' }
        import_and_check_query(renamed_tables, 'rasa')
      end

      it 'replaces table name in more complex queries on import' do
        setup_visualization_with_layer_query('tabula', 'SELECT COUNT(*) AS count FROM tabula WHERE tabula.yoyo=2')
        renamed_tables = { 'tabula' => 'rasa' }
        import_and_check_query(renamed_tables, 'rasa', 'SELECT COUNT(*) AS count FROM rasa WHERE rasa.yoyo=2')
      end

      it 'does not replace table name as part of a longer identifier' do
        setup_visualization_with_layer_query('tabula', 'SELECT * FROM tabula WHERE tabulacol=2')
        renamed_tables = { 'tabula' => 'rasa' }
        import_and_check_query(renamed_tables, 'rasa', 'SELECT * FROM rasa WHERE tabulacol=2')
      end

      it 'does not replace table name when query fails' do
        Carto::VisualizationsExportPersistenceService.any_instance.stubs(:test_query).returns(false)
        Carto::AnalysisNode.any_instance.stubs(:test_query).returns(false)
        Carto::Layer.any_instance.stubs(:test_query).returns(false)
        setup_visualization_with_layer_query('tabula', 'SELECT * FROM tabula WHERE tabulacol=2')
        renamed_tables = { 'tabula' => 'rasa' }
        import_and_check_query(renamed_tables, 'rasa', 'SELECT * FROM tabula WHERE tabulacol=2')
      end
    end
  end

  describe 'exporting + importing' do
    include Carto::Factories::Visualizations

    def verify_visualizations_match(imported_visualization,
                                    original_visualization,
                                    importing_user: nil,
                                    imported_name: original_visualization.name,
                                    imported_privacy: original_visualization.privacy)
      imported_visualization.name.should eq imported_name
      imported_visualization.description.should eq original_visualization.description
      imported_visualization.type.should eq original_visualization.type
      imported_visualization.tags.should eq original_visualization.tags
      imported_visualization.privacy.should eq imported_privacy
      imported_visualization.source.should eq original_visualization.source
      imported_visualization.license.should eq original_visualization.license
      imported_visualization.title.should eq original_visualization.title
      imported_visualization.kind.should eq original_visualization.kind
      imported_visualization.attributions.should eq original_visualization.attributions
      imported_visualization.bbox.should eq original_visualization.bbox
      imported_visualization.display_name.should eq original_visualization.display_name
      imported_visualization.version.should eq original_visualization.version

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

      verify_mapcap_match(imported_visualization.latest_mapcap, original_visualization.latest_mapcap)
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

      map_options = imported_map.options.with_indifferent_access
      original_map_options = original_map.options.with_indifferent_access
      map_options.should eq original_map_options
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
        imported_layer_options[:stat_tag].should eq imported_layer.maps.first.visualization.id
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
      imported_widget.options.should eq original_widget.options
      imported_widget.layer.should_not be_nil
      imported_widget.source_id.should eq original_widget.source_id
      imported_widget.styke.should eq original_widget.style
    end

    def verify_analyses_match(imported_analyses, original_analyses)
      imported_analyses.should_not be_nil
      imported_analyses.length.should eq original_analyses.length
      (0..(imported_analyses.length - 1)).each do |i|
        verify_analysis_match(imported_analyses[i], original_analyses[i])
      end
    end

    def verify_analysis_match(imported_analysis, original_analysis)
      imported_analysis.analysis_definition.should eq original_analysis.analysis_definition
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

    def verify_mapcap_match(imported_mapcap, original_mapcap)
      return true if imported_mapcap.nil? && original_mapcap.nil?

      imported_mapcap.export_json.should eq original_mapcap.export_json
      imported_mapcap.ids_json.should eq original_mapcap.ids_json
    end

    describe 'maps' do
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
        bypass_named_maps
        @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
        carto_layer = @visualization.layers.find { |l| l.kind == 'carto' }
        carto_layer.options[:user_name] = @user.username
        carto_layer.save
        @analysis = FactoryGirl.create(:source_analysis, visualization: @visualization, user: @user)
      end

      after(:each) do
        @analysis.destroy
        destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      end

      let(:export_service) { Carto::VisualizationsExportService2.new }

      it 'importing an exported visualization should create a new visualization with matching metadata' do
        exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz,
                                    @visualization,
                                    importing_user: @user,
                                    imported_name: "#{@visualization.name} Import")

        destroy_visualization(imported_viz.id)
      end

      it 'importing an exported visualization several times should change imported name' do
        exported_string = export_service.export_visualization_json_string(@visualization.id, @user)

        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz)
        imported_viz.name.should eq "#{@visualization.name} Import"

        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz2 = Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz)
        imported_viz2.name.should eq "#{@visualization.name} Import 2"

        destroy_visualization(imported_viz.id)
        destroy_visualization(imported_viz2.id)
      end

      it 'importing an exported visualization into another account should change layer user_name option' do
        exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz, @visualization, importing_user: @user2)

        destroy_visualization(imported_viz.id)
      end

      it 'importing an exported visualization should not keep the vizjson2 flag, but should return it' do
        @visualization.mark_as_vizjson2
        exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        expect(imported_viz.uses_vizjson2?).to be_false
        expect(export_service.marked_as_vizjson2_from_json_export?(exported_string)).to be_true

        destroy_visualization(imported_viz.id)
      end

      it 'importing a password-protected visualization keeps the password' do
        @visualization.privacy = 'password'
        @visualization.password = 'super_secure_secret'
        @visualization.save!

        exported_string = export_service.export_visualization_json_string(@visualization.id, @user, with_password: true)
        built_viz = export_service.build_visualization_from_json_export(exported_string)
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        verify_visualizations_match(imported_viz, @visualization, importing_user: @user2)
        expect(imported_viz.password_protected?).to be_true
        expect(imported_viz.has_password?).to be_true
        expect(imported_viz.password_valid?('super_secure_secret')).to be_true

        destroy_visualization(imported_viz.id)
      end

      describe 'if full_restore is' do
        before(:each) do
          @visualization.permission.acl = [{
            type: 'user',
            entity: {
              id: @user2.id,
              username: @user2.username
            },
            access: 'r'
          }]
          @visualization.permission.save
          @visualization.locked = true
          @visualization.save!
          @visualization.create_mapcap!
          @visualization.reload
        end

        it 'false, it should generate a random uuid and blank permission, no mapcap and unlocked' do
          exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
          original_attributes = @visualization.attributes.symbolize_keys
          built_viz = export_service.build_visualization_from_json_export(exported_string)
          original_id = built_viz.id

          imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)
          imported_viz.id.should_not eq original_id
          imported_viz.permission.acl.should be_empty
          imported_viz.shared_entities.count.should be_zero
          imported_viz.mapcapped?.should be_false
          expect(imported_viz.created_at.to_s).not_to eq original_attributes[:created_at].to_s
          expect(imported_viz.updated_at.to_s).not_to eq original_attributes[:updated_at].to_s

          destroy_visualization(imported_viz.id)
        end

        it 'true, it should keep the imported uuid, permission, mapcap, and locked' do
          exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
          original_attributes = @visualization.attributes.symbolize_keys
          built_viz = export_service.build_visualization_from_json_export(exported_string)
          test_id = random_uuid
          built_viz.id = test_id

          imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz, full_restore: true)
          imported_viz.id.should eq test_id
          imported_viz.permission.acl.should_not be_empty
          imported_viz.shared_entities.count.should eq 1
          imported_viz.shared_entities.first.recipient_id.should eq @user2.id
          imported_viz.mapcapped?.should be_true
          imported_viz.locked?.should be_true
          expect(imported_viz.created_at.to_s).to eq original_attributes[:created_at].to_s
          expect(imported_viz.updated_at.to_s).to eq original_attributes[:updated_at].to_s

          destroy_visualization(imported_viz.id)
        end
      end

      describe 'basemaps' do
        describe 'custom' do
          before(:each) do
            @user2.reload
            @user2.layers.clear

            carto_layer = @visualization.layers.find { |l| l.kind == 'carto' }
            carto_layer.options[:user_name] = @user.username
            carto_layer.save
          end

          let(:mapbox_layer) do
            {
              urlTemplate: 'https://api.mapbox.com/styles/v1/wadus/ciu4g7i1500t62iqgcgt9xwez/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IaoianVhcmlnbmFjaW9zbCIsImEiOiJjaXU1ZzZmcXMwMDJ0MnpwYWdiY284dTFiIn0.uZuarRtgWTv20MdNCq856A',
              attribution: nil,
              maxZoom: 21,
              minZoom: 0,
              name: '',
              category: 'Mapbox',
              type: 'Tiled',
              className: 'httpsapimapboxcomstylesv1wadusiu4g7i1500t62iqgcgt9xweztiles256zxy2xaccess_tokenpkeyj1iaoianvhbmlnbmfjaw9zbcisimeioijjaxu1zzzmcxmwmdj0mnpwywdiy284dtfiin0uzuarrtgwtv20mdncq856a'
            }
          end

          it 'importing an exported visualization with a custom basemap should add the layer to user layers' do
            base_layer = @visualization.base_layers.first
            base_layer.options = mapbox_layer
            base_layer.save

            user_layers = @user2.layers
            user_layers.find { |l| l.options['urlTemplate'] == base_layer.options['urlTemplate'] }.should be_nil
            user_layers_count = user_layers.count

            exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
            built_viz = export_service.build_visualization_from_json_export(exported_string)
            imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

            @user2.reload
            new_user_layers = @user2.layers

            new_user_layers.count.should eq user_layers_count + 1
            new_user_layers.find { |l| l.options['urlTemplate'] == base_layer.options['urlTemplate'] }.should_not be_nil

            destroy_visualization(imported_viz.id)

            # Layer should not be the map one
            @user2.reload
            new_user_layers = @user2.layers

            new_user_layers.count.should eq user_layers_count + 1
          end

          it 'importing an exported visualization with a custom basemap twice should add the layer to user layers only once' do
            base_layer = @visualization.base_layers.first
            base_layer.options = mapbox_layer
            base_layer.save

            user_layers = @user2.layers
            user_layers.find { |l| l.options['urlTemplate'] == base_layer.options['urlTemplate'] }.should be_nil
            user_layers_count = user_layers.count

            exported_string = export_service.export_visualization_json_string(@visualization.id, @user)
            built_viz = export_service.build_visualization_from_json_export(exported_string)
            imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)
            built_viz = export_service.build_visualization_from_json_export(exported_string)
            imported_viz2 = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

            @user2.reload
            new_user_layers = @user2.layers

            new_user_layers.count.should eq user_layers_count + 1
            destroy_visualization(imported_viz2.id)
            destroy_visualization(imported_viz.id)
          end
        end
      end
    end

    describe 'datasets' do
      before(:all) do
        @sequel_user = FactoryGirl.create(:valid_user, :private_tables, private_maps_enabled: true, table_quota: nil)
        @user = Carto::User.find(@sequel_user.id)

        @sequel_user2 = FactoryGirl.create(:valid_user, :private_tables, private_maps_enabled: true, table_quota: nil)
        @user2 = Carto::User.find(@sequel_user2.id)

        @sequel_user_no_private_tables = FactoryGirl.create(:valid_user, private_maps_enabled: true, table_quota: nil)
        @user_no_private_tables = Carto::User.find(@sequel_user_no_private_tables.id)
      end

      after(:all) do
        @sequel_user.destroy
      end

      before(:each) do
        bypass_named_maps
        @table = FactoryGirl.create(:carto_user_table, :full, user: @user)
        @table_visualization = @table.table_visualization
        @table_visualization.reload
        @table_visualization.active_layer = @table_visualization.data_layers.first
        @table_visualization.save
      end

      after(:each) do
        @table_visualization.destroy
      end

      let(:export_service) { Carto::VisualizationsExportService2.new }

      it 'importing an exported dataset should keep the user_table' do
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        # Create user db table (destroyed above)
        @user2.in_database.execute("CREATE TABLE #{@table_visualization.name} (cartodb_id int)")
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz, @table_visualization, importing_user: @user2)
        imported_viz.map.user_table.should be

        destroy_visualization(imported_viz.id)
      end

      it 'importing a dataset with an existing name should raise an error' do
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        expect { Carto::VisualizationsExportPersistenceService.new.save_import(@user, built_viz) }.to raise_error(
          'Cannot rename a dataset during import')
      end

      it 'importing a dataset without a table should raise an error' do
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        expect { Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz) }.to raise_error(
          'Cannot import a dataset without physical table')
      end

      it 'importing an exported dataset should keep the synchronization' do
        FactoryGirl.create(:carto_synchronization, visualization: @table_visualization)
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        # Create user db table (destroyed above)
        @user2.in_database.execute("CREATE TABLE #{@table_visualization.name} (cartodb_id int)")
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz, @table_visualization, importing_user: @user2)
        sync = imported_viz.synchronization
        sync.should be
        sync.user_id.should eq @user2.id
        sync.log.user_id.should eq @user2.id

        destroy_visualization(imported_viz.id)
      end

      it 'imports an exported dataset with external data import without a synchronization' do
        @table.data_import = FactoryGirl.create(:data_import, user: @user2, table_id: @table.id)
        @table.save!
        FactoryGirl.create(:external_data_import_with_external_source, data_import: @table.data_import)
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user2)
        built_viz = export_service.build_visualization_from_json_export(exported_string)
        @user2.in_database.execute("CREATE TABLE #{@table_visualization.name} (cartodb_id int)")

        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        imported_viz.should be
        destroy_visualization(imported_viz.id)
      end

      it 'keeps private privacy is private tables enabled' do
        @table_visualization.update_attributes(privacy: 'private')
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        # Create user db table (destroyed above)
        @user2.in_database.execute("CREATE TABLE #{@table_visualization.name} (cartodb_id int)")
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user2, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz, @table_visualization, importing_user: @user2,
                                                                        imported_privacy: 'private')

        destroy_visualization(imported_viz.id)
      end

      it 'converts to privacy public if private tables disabled' do
        @table_visualization.update_attributes(privacy: 'private')
        exported_string = export_service.export_visualization_json_string(@table_visualization.id, @user)
        built_viz = export_service.build_visualization_from_json_export(exported_string)

        # Create user db table (destroyed above)
        @user_no_private_tables.in_database.execute("CREATE TABLE #{@table_visualization.name} (cartodb_id int)")
        imported_viz = Carto::VisualizationsExportPersistenceService.new.save_import(@user_no_private_tables, built_viz)

        imported_viz = Carto::Visualization.find(imported_viz.id)
        verify_visualizations_match(imported_viz, @table_visualization, importing_user: @user_no_private_tables,
                                                                        imported_privacy: 'public')

        destroy_visualization(imported_viz.id)
      end
    end
  end
end
