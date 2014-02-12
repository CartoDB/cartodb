# coding: UTF-8

require_relative '../spec_helper'
require_relative '../../services/named-maps-api-wrapper/lib/named_maps_wrapper'

include CartoDB

# Specs for /services/named-maps-api-wrapper
# Does not check responses from the windshaft API endpoint
describe CartoDB::NamedMapsWrapper::NamedMaps do

  SPEC_NAME = 'named_maps_spec'

  before(:all) do
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    # Hook new backend to Sequel current connection
    Visualization.repository = DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :visualizations)

    puts "\n[rspec][#{SPEC_NAME}] Creating test user database..."
    @user = create_user( :quota_in_bytes => 524288000, :table_quota => 100 )

    puts "[rspec][#{SPEC_NAME}] Running..."
  end

  before(:each) do
    Typhoeus::Expectation.clear()
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
  end


  describe 'public_table' do
    it 'public map with public visualization does not create a named map' do
      table = create_table( user_id: @user.id )
      table.privacy = Table::PUBLIC
      table.save()
      table.should be_public
      table.table_visualization.privacy.should eq 'public'

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()

      # Only this method should be called
      CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      table.affected_visualizations.size.should eq 2
      table.affected_visualizations[0].id.should eq table.table_visualization.id
      table.affected_visualizations[1].id.should eq derived_vis.id
      table.affected_visualizations[0].id.should_not eq table.affected_visualizations[1].id
    end
  end #public_table_public_vis


  describe 'private_table' do
    it 'private map with public visualization should create a named map' do
      table = create_table( user_id: @user.id )

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()
      derived_vis.privacy = CartoDB::Visualization::Member::PUBLIC

      # Get
      Typhoeus.stub( %r{http:\/\/[a-z0-9]+\.localhost\.lan:8181\/tiles\/template\/[a-zA-Z0-9_]+\?api_key=.*} )
              .and_return(
                Typhoeus::Response.new(code: 404, body: "")
              )

      #Post to create
      new_template_body = { template_id: 'tpl_fakeid' }

      Typhoeus.stub( "http://#{@user.username}.localhost.lan:8181/tiles/template?api_key=#{@user.api_key}" )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( new_template_body ) )
              )

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      template_id = CartoDB::NamedMapsWrapper::NamedMap.normalize_name(derived_vis.id)

      named_map_template_data = {
        template_id: template_id
      }

      # Reset expectations
      Typhoeus::Expectation.clear()

      # Now check that named_map_template_data[:template_id] is the template asked for
      Typhoeus.stub( "http://#{@user.username}.localhost.lan:8181/tiles/template/#{template_id}?api_key=#{@user.api_key}" )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( named_map_template_data ) )
              )

      named_map = derived_vis.has_named_map?()

      named_map.should_not eq false
      named_map.template.should eq named_map_template_data
    end
  end #private_table




  describe 'named_map_updated_on_visualization_updated' do
    it 'checks that when you update a visualization the named map gets updated' do
      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'open'
          },
          placeholders: {
            layer0: {
              type: "number",
              default: 1
            }
          },
          layergroup: {
            layers: [
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from test1) SELECT * from wrapped_query where <%= layer0 %>=1",
                  layer_name: "test1",
                  cartocss: "/** */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              }
            ]
          }
        }
      }

      # Stub for only GET & PUT calls performed inside this method
      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      derived_vis.name = "renamed_visualization"
      # This should trigger the PUT call
      derived_vis.store()

    end
  end #named_map_updated_on_visualization_updated


  describe 'only_torque_layer' do
    it 'checks returned viz.json given a named map with only a torque layer' do

      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'open'
          },
          placeholders: {},
          layergroup: {
            layers: [
              {
                type: 'torque',
                options: {
                  cartocss_version: '2.0.1',
                  cartocss: '/** */',
                  sql: 'select * from ne_10m_populated_places_simple'
                }
              }
            ]
          }
        }
      }

      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      derived_vis.map.layers.each{ |layer|
        derived_vis.map.remove_layer(layer) if layer.kind == 'carto'
      }

      derived_vis.map.add_layer( Layer.create( 
        kind: 'torque', 
        options: { 
          query: "select * from #{table.name}", 
          table_name: table.name ,
          tile_style: '',
        } 
      ) )
      derived_vis.store()

      vizjson = get_vizjson(derived_vis)

      vizjson.include?(:id).should eq true
      vizjson.include?(:version).should eq true
      vizjson.include?(:title).should eq true
      vizjson.include?(:description).should eq true
      vizjson.include?(:layers).should eq true

      vizjson[:layers].size.should eq 2
      # First is always the base layer
      vizjson[:layers][0][:type].should eq 'tiled'

      vizjson[:layers][1][:type].should eq 'torque'
      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq '8181'
      vizjson[:layers][1][:options][:sql_api_protocol].should eq 'http'
      vizjson[:layers][1][:options][:sql_api_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:sql_api_endpoint].should eq '/api/v1/sql'
      vizjson[:layers][1][:options][:sql_api_port].should eq 8080
      vizjson[:layers][1][:options].include?(:cdn_url).should eq true
      vizjson[:layers][1][:options].include?(:layer_name).should eq true
      vizjson[:layers][1][:options].include?(:table_name).should eq true
      vizjson[:layers][1][:options].include?(:tile_style).should eq true
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id

      # Never expose torque SQL query in the vizjson
      vizjson[:layers][1][:options].include?(:sql).should_not eq true
    end
  end #only_torque_layer


  describe 'only_normal_layer' do
    it 'checks returned viz.json given a default named map which has only a normal layer' do
      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'open'
          },
          placeholders: {
            layer0: {
              type: "number",
              default: 1
            }
          },
          layergroup: {
            layers: [
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from ne_10m_populated_places_simple) SELECT * from wrapped_query where <%= layer0 %>=1",
                  layer_name: "ne_10m_populated_places_simple",
                  cartocss: "/**  */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              }
            ]
          }
        }
      }

      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      vizjson = get_vizjson(derived_vis)

      vizjson.include?(:id).should eq true
      vizjson.include?(:version).should eq true
      vizjson.include?(:title).should eq true
      vizjson.include?(:description).should eq true
      vizjson.include?(:layers).should eq true

      vizjson[:layers].size.should eq 2
      vizjson[:layers][0][:type].should eq 'tiled'

      vizjson[:layers][1][:type].should eq 'namedmap'
      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq '8181'
      vizjson[:layers][1][:options].include?(:cdn_url).should eq true
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id
      vizjson[:layers][1][:options][:named_map][:params].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer0).should eq true
      vizjson[:layers][1][:options][:named_map][:params][:layer0].should eq 1
      vizjson[:layers][1][:options][:named_map][:layers].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:layers][0].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][0].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][0][:interactivity].should eq 'cartodb_id'
    end
  end #only_normal_layer


  describe 'torque_and_normal_layers' do
    it 'checks returned viz.json given a named map with a normal layer and a torque one' do
      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'open'
          },
          placeholders: {
            layer0: {
              type: "number",
              default: 1
            }
          },
          layergroup: {
            layers: [
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from table_50m_urban_area) SELECT * from wrapped_query where <%= layer0 %>=1",
                  layer_name: "table_50m_urban_area",
                  cartocss: "/** */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              },
              {
                type: "torque",
                options: {
                  cartocss_version: "2.0.1",
                  cartocss: "/** */",
                  sql: "select * from ne_10m_populated_places_simple"
                }
              }
            ]
          }
        }
      }

      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      derived_vis.map.add_layer( Layer.create( 
        kind: 'torque', 
        options: { 
          query: "select * from #{table.name}", 
          table_name: table.name ,
          tile_style: '',
        } 
      ) )
      derived_vis.store()

      vizjson = get_vizjson(derived_vis)

      vizjson.include?(:id).should eq true
      vizjson.include?(:version).should eq true
      vizjson.include?(:title).should eq true
      vizjson.include?(:description).should eq true
      vizjson.include?(:layers).should eq true

      vizjson[:layers].size.should eq 3
      vizjson[:layers][0][:type].should eq 'tiled'

      vizjson[:layers][1][:type].should eq 'namedmap'

      vizjson[:layers][2][:type].should eq 'torque'

      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq '8181'
      vizjson[:layers][1][:options].include?(:cdn_url).should eq true
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id
      vizjson[:layers][1][:options][:named_map][:params].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer0).should eq true
      vizjson[:layers][1][:options][:named_map][:params][:layer0].should eq 1
      vizjson[:layers][1][:options][:named_map][:layers].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:layers][0].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][0].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][0][:interactivity].should eq 'cartodb_id'

      vizjson[:layers][2][:type].should eq 'torque'
      vizjson[:layers][2].include?(:order).should eq true
      vizjson[:layers][2][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][2][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][2][:options][:tiler_port].should eq '8181'
      vizjson[:layers][2][:options][:sql_api_protocol].should eq 'http'
      vizjson[:layers][2][:options][:sql_api_domain].should eq 'localhost.lan'
      vizjson[:layers][2][:options][:sql_api_endpoint].should eq '/api/v1/sql'
      vizjson[:layers][2][:options][:sql_api_port].should eq 8080
      vizjson[:layers][2][:options].include?(:cdn_url).should eq true
      vizjson[:layers][2][:options].include?(:layer_name).should eq true
      vizjson[:layers][2][:options].include?(:table_name).should eq true
      vizjson[:layers][2][:options].include?(:tile_style).should eq true
      vizjson[:layers][2][:options].include?(:named_map).should eq true
      vizjson[:layers][2][:options][:named_map][:name].should eq template_id

      vizjson[:layers][2][:options].include?(:sql).should_not eq true

    end
  end #torque_and_normal_layers


  describe 'two_normal_layers' do
    it 'checks returned viz.json given a named map with 2 normal ones' do
      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'open'
          },
          placeholders: {
            layer0: {
              type: "number",
              default: 1
            },
            layer1: {
              type: "number",
              default: 1
            }
          },
          layergroup: {
            layers: [
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from test1) SELECT * from wrapped_query where <%= layer0 %>=1",
                  layer_name: "test1",
                  cartocss: "/** */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              },
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from test2) SELECT * from wrapped_query where <%= layer1 %>=1",
                  layer_name: "test2",
                  cartocss: "/** */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              }
            ]
          }
        }
      }

      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      derived_vis.map.add_layer( Layer.create( 
        kind: 'carto', 
        options: { 
          query: "select * from #{table.name}", 
          table_name: table.name,
          style_version: '2.1.1',
          tile_style: '/** */',
          interactivity: 'cartodb_id'
        } 
      ) )
      derived_vis.store()

      vizjson = get_vizjson(derived_vis)

      vizjson.include?(:id).should eq true
      vizjson.include?(:version).should eq true
      vizjson.include?(:title).should eq true
      vizjson.include?(:description).should eq true
      vizjson.include?(:layers).should eq true


      vizjson[:layers].size.should eq 2
      vizjson[:layers][0][:type].should eq 'tiled'
      vizjson[:layers][1][:type].should eq 'namedmap'

      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq '8181'
      vizjson[:layers][1][:options].include?(:cdn_url).should eq true
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id
      vizjson[:layers][1][:options][:named_map][:params].size.should eq 2
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer0).should eq true
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer1).should eq true
      vizjson[:layers][1][:options][:named_map][:params][:layer0].should eq 1
      vizjson[:layers][1][:options][:named_map][:params][:layer1].should eq 1

      vizjson[:layers][1][:options][:named_map][:layers].size.should eq 2
      vizjson[:layers][1][:options][:named_map][:layers][0].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][0].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][0][:interactivity].should eq 'cartodb_id'
      vizjson[:layers][1][:options][:named_map][:layers][1].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][1].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][1][:interactivity].should eq 'cartodb_id'
    end
  end #two_normal_layers


  private


  # To ease testing, convert everything to symbols
  def get_vizjson(visualization)
      vizjson = visualization.to_vizjson().deep_symbolize_keys()
      vizjson[:layers].map! { |layer| 
        layer.deep_symbolize_keys()
      }
      vizjson
  end #get_vizjson


  # Does all the work and stubbing required to create a private table with an associated visualization
  # NOTE: Leaves stubbed calls to GET the template so they return the correct template data
  def create_private_table_with_public_visualization(template_data, visualization_privacy = CartoDB::Visualization::Member::PUBLIC)
    table = create_table( user_id: @user.id )
    derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()
    derived_vis.privacy = visualization_privacy
    template_id = CartoDB::NamedMapsWrapper::NamedMap.normalize_name(derived_vis.id)

    Typhoeus.stub( %r{http:\/\/[a-z0-9]+\.localhost\.lan:8181\/tiles\/template\/[a-zA-Z0-9_]+\?api_key=.*} )
            .and_return(
              Typhoeus::Response.new(code: 404, body: "")
            )
    # Stub all petitions, not just GET
    Typhoeus.stub( "http://#{@user.username}.localhost.lan:8181/tiles/template?api_key=#{@user.api_key}" )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_id: template_id ) )
            )

    derived_vis.store()
    collection  = Visualization::Collection.new.fetch()
    collection.add(derived_vis)
    collection.store()
    
    template_data[:template][:name] = template_id

    Typhoeus::Expectation.clear()
    # Retrievals
    Typhoeus.stub(
      "http://#{@user.username}.localhost.lan:8181/tiles/template/#{template_id}?api_key=#{@user.api_key}", 
      { method: :get} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )

    # Updates
    Typhoeus.stub(
        "http://#{@user.username}.localhost.lan:8181/tiles/template/#{template_id}?api_key=#{@user.api_key}", 
        { method: :put} )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
              )

    return table, derived_vis, template_id
  end #create_map_with_public_visualization

end
