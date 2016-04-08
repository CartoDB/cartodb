# coding: UTF-8

require_relative '../spec_helper'
require_relative '../../services/named-maps-api-wrapper/lib/named_maps_wrapper'

include CartoDB

# Specs for /services/named-maps-api-wrapper
# NOTES:
# - Does not check responses from the windshaft API endpoint, stubs them
# - Typhoeus allows stubbing, but no easy way of knowing how many times (if any) you called it
describe CartoDB::NamedMapsWrapper::NamedMaps do

  before(:all) do


    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
    # Hook new backend to Sequel current connection
    Visualization.repository = DataRepository::Backend::Sequel.new(Rails::Sequel.connection, :visualizations)
  end

  before(:each) do
    Typhoeus::Expectation.clear
    CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)

    Typhoeus.stub( tiler_regex,
      { method: :get}  )
            .and_return(
              Typhoeus::Response.new(code: 404, body: '')
            )

    Typhoeus::Response.any_instance.stubs(:total_time).returns(1)

    # For relator->permission
    user_id = UUIDTools::UUID.timestamp_create.to_s
    user_name = 'whatever'
    user_apikey = '123'

    @user = FactoryGirl.create(:valid_user, private_tables_enabled: true)

    CartoDB::Visualization::Relator.any_instance.stubs(:user).returns(@user)
  end

  after(:each) do
    @user.destroy
  end

  describe '#template_name' do
    it 'tests normalization of names' do
      name_1 = '08fee512-97cf-11e3-a775-30f9edfe5da6'
      expected_name_1 = CartoDB::NamedMapsWrapper::NamedMap::NAME_PREFIX + '08fee512_97cf_11e3_a775_30f9edfe5da6'

      name_2 = '!&32 += 01Z'
      expected_name_2 = CartoDB::NamedMapsWrapper::NamedMap::NAME_PREFIX + '3201Z'

      normalized_name_1 = CartoDB::NamedMapsWrapper::NamedMap.template_name(name_1)
      normalized_name_1.should eq expected_name_1

      normalized_name_2 = CartoDB::NamedMapsWrapper::NamedMap.template_name(name_2)
      normalized_name_2.should eq expected_name_2
    end
  end

  describe 'password_protected_visualization' do
    it 'tests visualization auth capabilities for password restricted type' do

      auth_token = '1234567890abcdef'

      template_data = {
        template: {
          version: '0.0.1',
          name: '@@PLACEHOLDER@@',
          auth: {
            method: 'token',
            valid_tokens: [ auth_token ]
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

      # Post: to create (as now all tables/viz create named maps)
      Typhoeus.stub( named_maps_url(@user.api_key),
        { method: :post } )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( { template_id: 'tpl_fakeid' } ) )
              )

      table = create_table(user_id: @user.id)
      table.privacy = UserTable::PRIVACY_PUBLIC
      table.save()
      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()

      password = 's4mpl3_:Password!!!'

      derived_vis.privacy = CartoDB::Visualization::Member::PRIVACY_PROTECTED
      derived_vis.password = password

      # Post: to create
      Typhoeus.stub( named_maps_url(@user.api_key),
        { method: :post } )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( { template_id: 'tpl_fakeid' } ) )
              )

      template_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(derived_vis.id)

      Typhoeus::Expectation.clear()
      # Retrieval
      Typhoeus.stub( named_map_url(template_id, @user.api_key),
      { method: :get} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )

      derived_vis.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PROTECTED
      derived_vis.has_password?.should eq true
      derived_vis.password_valid?(password).should eq true
      derived_vis.password_valid?('some invalid passsword').should eq false

      derived_vis.get_auth_tokens().should eq [auth_token]
    end
  end

  describe 'public_table' do
    it 'public map with public visualization creates a named map' do
      #Post to create
      new_template_body = { template_id: 'tpl_fakeid' }

      Typhoeus.stub( named_maps_url(@user.api_key) )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( new_template_body ) )
              )

      table = create_table( user_id: @user.id )
      table.privacy = UserTable::PRIVACY_PUBLIC
      table.save()
      table.should be_public
      table.table_visualization.privacy.should eq CartoDB::Visualization::Member::PRIVACY_PUBLIC

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()

      # Only this method should be called
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:delete => true)

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      table.affected_visualizations.size.should eq 2
      table.affected_visualizations[0].id.should eq table.table_visualization.id
      table.affected_visualizations[1].id.should eq derived_vis.id
      table.affected_visualizations[0].id.should_not eq table.affected_visualizations[1].id
    end
  end

  describe 'private_table' do
    it 'private map with public visualization should create a named map' do
      #Post to create
      new_template_body = { template_id: 'tpl_fakeid' }

      Typhoeus.stub( named_maps_url(@user.api_key) )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( new_template_body ) )
              )

      table = create_table( user_id: @user.id )

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()
      derived_vis.privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC

      # Get
      Typhoeus.stub( tiler_regex )
              .and_return(
                Typhoeus::Response.new(code: 404, body: "")
              )

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      template_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(derived_vis.id)

      named_map_template_data = {
        template_id: template_id
      }

      # Reset expectations
      Typhoeus::Expectation.clear()

      # Now check that named_map_template_data[:template_id] is the template asked for
      Typhoeus.stub( named_map_url(template_id,@user.api_key) )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( named_map_template_data ) )
              )

      named_map = derived_vis.get_named_map

      named_map.should_not eq false
      named_map.template.should eq named_map_template_data
    end
  end


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
      derived_vis.store
    end
  end


  describe 'named_map_deleted_on_visualization_updated' do
    it 'checks that when you delete a visualization with a named map it gets deleted too' do
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

      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      Typhoeus::Expectation.clear()

      # Return having a named map...
      Typhoeus.stub( named_map_url(template_id,@user.api_key),
        { method: :get} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )
      # Before deleting a put is performed too
      Typhoeus.stub( named_map_url(template_id,@user.api_key),
        { method: :put} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )
      # And return a 204 correctly on deletion
      Typhoeus.stub( named_map_url(template_id,@user.api_key),
        { method: :delete } )
              .and_return(
                Typhoeus::Response.new( code: 204, body: "" )
              )

      derived_vis.delete()  # This will trigger a delete
    end
  end

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

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'torque' }.size.should eq 1

      # First is always the base layer
      vizjson[:layers][0][:type].should eq 'tiled'

      vizjson[:layers][1][:type].should eq 'torque'
      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq public_tiler_port
      vizjson[:layers][1][:options][:sql_api_protocol].should eq 'http'
      vizjson[:layers][1][:options][:sql_api_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:sql_api_endpoint].should eq '/api/v2/sql'
      vizjson[:layers][1][:options][:sql_api_port].should eq 8080
      vizjson[:layers][1][:options].include?(:layer_name).should eq true
      vizjson[:layers][1][:options].include?(:table_name).should eq true
      vizjson[:layers][1][:options].include?(:tile_style).should eq true
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id

      # Never expose torque SQL query in the vizjson
      vizjson[:layers][1][:options].include?(:sql).should_not eq true
    end
  end


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

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1

      vizjson[:layers][1][:type].should eq 'namedmap'
      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq public_tiler_port
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
  end


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

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1
      vizjson[:layers].select { |layer| layer[:type] == 'torque' }.size.should eq 1

      vizjson[:layers][0][:type].should eq 'tiled'
      vizjson[:layers][1][:type].should eq 'namedmap'
      vizjson[:layers][2][:type].should eq 'torque'

      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq public_tiler_port
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
      vizjson[:layers][2][:options][:tiler_port].should eq public_tiler_port
      vizjson[:layers][2][:options][:sql_api_protocol].should eq 'http'
      vizjson[:layers][2][:options][:sql_api_domain].should eq 'localhost.lan'
      vizjson[:layers][2][:options][:sql_api_endpoint].should eq '/api/v2/sql'
      vizjson[:layers][2][:options][:sql_api_port].should eq 8080
      vizjson[:layers][2][:options].include?(:layer_name).should eq true
      vizjson[:layers][2][:options].include?(:table_name).should eq true
      vizjson[:layers][2][:options].include?(:tile_style).should eq true
      vizjson[:layers][2][:options].include?(:named_map).should eq true
      vizjson[:layers][2][:options][:named_map][:name].should eq template_id

      vizjson[:layers][2][:options].include?(:sql).should_not eq true

    end
  end

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

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

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

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1
      vizjson[:layers][0][:type].should eq 'tiled'
      vizjson[:layers][1][:type].should eq 'namedmap'

      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options].include?(:user_name).should eq true
      vizjson[:layers][1][:options][:tiler_protocol].should eq 'http'
      vizjson[:layers][1][:options][:tiler_domain].should eq 'localhost.lan'
      vizjson[:layers][1][:options][:tiler_port].should eq public_tiler_port
      vizjson[:layers][1][:options].include?(:named_map).should eq true
      vizjson[:layers][1][:options][:named_map][:name].should eq template_id
      vizjson[:layers][1][:options][:named_map][:params].size.should eq 2
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer0).should eq true
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer1).should eq true
      vizjson[:layers][1][:options][:named_map][:params][:layer0].should eq 1
      vizjson[:layers][1][:options][:named_map][:params][:layer1].should eq 0

      vizjson[:layers][1][:options][:named_map][:layers].size.should eq 2
      vizjson[:layers][1][:options][:named_map][:layers][0].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][0].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][0][:interactivity].should eq 'cartodb_id'
      vizjson[:layers][1][:options][:named_map][:layers][1].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][1].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][1][:interactivity].should eq 'cartodb_id'
    end
  end

  describe 'http_layer' do
    it 'checks that a tiled layer appears as http layer on a named map but not on the viz.json' do

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
                type: "http",
                options: {
                  urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
                  subdomains: "abcd"
                }
              },
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from test2) SELECT * from wrapped_query where <%= layer0 %>=1",
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

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      vizjson = get_vizjson(derived_vis)

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1
      vizjson[:layers][0][:type].should eq 'tiled'
      vizjson[:layers][1][:type].should eq 'namedmap'

      vizjson[:layers][1].include?(:order).should eq true
      vizjson[:layers][1][:options][:type].should eq 'namedmap'
      vizjson[:layers][1][:options][:named_map][:params].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer0).should eq true
      vizjson[:layers][1][:options][:named_map][:params].include?(:layer1).should eq false
      vizjson[:layers][1][:options][:named_map][:params][:layer0].should eq 1

      vizjson[:layers][1][:options][:named_map][:layers].size.should eq 1
      vizjson[:layers][1][:options][:named_map][:layers][0].deep_symbolize_keys()
      vizjson[:layers][1][:options][:named_map][:layers][0].include?(:layer_name).should eq true
      vizjson[:layers][1][:options][:named_map][:layers][0][:interactivity].should eq 'cartodb_id'

      # HACK: Retrieve the named map and use it to regenerate template contents and check them
      named_maps_instance = derived_vis.send(:named_maps)
      template = CartoDB::NamedMapsWrapper::NamedMap.get_template_data(derived_vis, named_maps_instance)

      # Because basemap layers don't count for placeholders
      template[:placeholders][:layer0].nil?.should eq false
      template[:placeholders][:layer1].nil?.should eq true

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1
      template[:layergroup][:layers][0][:type].should eq 'http'
      template[:layergroup][:layers][1][:type].should eq 'cartodb'

      # INFO: Slice is because we do at once all vis, derived vis and named map creation, so we check that looks valid enough
      template[:layergroup][:layers][0][:options][:urlTemplate].slice(0, 33).should ==
        template_data[:template][:layergroup][:layers][0][:options][:urlTemplate].slice(0, 33)
      template[:layergroup][:layers][0][:options][:subdomains].should == template_data[:template][:layergroup][:layers][0][:options][:subdomains]

      template[:layergroup][:layers][0].keys.should == [:type, :options]
      template[:layergroup][:layers][0][:options].keys.should == [:urlTemplate, :subdomains]

      template[:layergroup][:layers][1][:options].include?(:urlTemplate).should eq false
      template[:layergroup][:layers][1][:options].include?(:subdomains).should eq false
    end
  end

  describe 'view data' do
    it "Doesn't returns an http layer if missing urlTemplate" do
      layer = {
        options: {
          type: "not-plain"
        }
      }
      layer_num = 0
      template_data = {}

      results = CartoDB::NamedMapsWrapper::NamedMap.send(:options_for_basemap_layer, layer, layer_num, template_data)
      results.nil?.should eq true

      layer = {
        options: {
          type: "not-plain",
          'urlTemplate' => ''
        }
      }
      results = CartoDB::NamedMapsWrapper::NamedMap.send(:options_for_basemap_layer, layer, layer_num, template_data)
      results.nil?.should eq true

      layer = {
        options: {
          type: "not-plain",
          'urlTemplate' => nil
        }
      }
      results = CartoDB::NamedMapsWrapper::NamedMap.send(:options_for_basemap_layer, layer, layer_num, template_data)
      results.nil?.should eq true

      layer = {
        options: {
          type: "not-plain",
          "urlTemplate" => "cartodb.com",
          "subdomains" => "abcd"
        }
      }
      expected_results = {
        layer_name: 'http',
        layer_options: {
          urlTemplate: layer[:options]["urlTemplate"],
          subdomains: layer[:options]["subdomains"]
        },
        layer_num: layer_num,
        template_data: template_data
      }
      results = CartoDB::NamedMapsWrapper::NamedMap.send(:options_for_basemap_layer, layer, layer_num, template_data)
      results.nil?.should eq false
      results.should == expected_results
    end

    it 'checks that the named map builds correctly the :view section' do

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
                type: "http",
                options: {
                  urlTemplate: "http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",
                  subdomains: "abcd"
                }
              },
              {
                type: "cartodb",
                options: {
                  sql: "WITH wrapped_query AS (select * from test2) SELECT * from wrapped_query where <%= layer0 %>=1",
                  layer_name: "test2",
                  cartocss: "/** */",
                  cartocss_version: "2.1.1",
                  interactivity: "cartodb_id"
                }
              }
            ]
          },
          view: {
            zoom: 3,
            center: {
              lng: 0.0,
              lat: 30.0
            }
          }
        }
      }

      # To align with expected named map data and forget about internals of zooming
      ::Map.any_instance.stubs(:recalculate_zoom!).returns(nil)


      table, derived_vis, template_id = create_private_table_with_public_visualization(template_data)

      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      # To align with expected named map data and forget about internals of centering
      ::Map.any_instance.stubs(:center_data).returns([30.0, 0.0])

      vizjson = get_vizjson(derived_vis)

      vizjson[:layers].select { |layer| layer[:type] == 'tiled' }.size.should >= 1
      vizjson[:layers].select { |layer| layer[:type] == 'namedmap' }.size.should eq 1
      vizjson[:layers][0][:type].should eq 'tiled'
      vizjson[:layers][1][:type].should eq 'namedmap'

      # HACK: Retrieve the named map and use it to regenerate template contents and check them
      named_maps_instance = derived_vis.send(:named_maps)
      template = CartoDB::NamedMapsWrapper::NamedMap.get_template_data(derived_vis, named_maps_instance)

      template.keys.should == [:version, :name, :auth, :placeholders, :layergroup, :view]
      # Ignore on purpose default bounds, as now there will always be a non-zero value
      template[:view][:zoom].should == template_data[:template][:view][:zoom]
      template[:view][:center].should == template_data[:template][:view][:center]

      ::Map.any_instance.stubs(:get_map_bounds).returns({
          maxy: 15,
          maxx: 14,
          miny: 13,
          minx: 12
        })
      derived_vis.map.recalculate_bounds!

      template_data[:template][:view][:bounds] = {
                            west:  12,
                            south: 13,
                            east:  14,
                            north: 15
                          }

      template = CartoDB::NamedMapsWrapper::NamedMap.get_template_data(derived_vis, named_maps_instance)
      template[:view].should == template_data[:template][:view]
    end
  end

  private

  def tiler_port
    Cartodb.config[:tiler]['internal']['port']
  end

  def public_tiler_port
    Cartodb.config[:tiler]['public']['port']
  end

  def tiler_regex
    if (tiler_port == '8888')
      %r{http:\/\/127\.0\.0\.1:8888\/api\/v1\/map\/named\/[a-zA-Z0-9_]+\?api_key=.*}
    else
      %r{http:\/\/127\.0\.0\.1:8181\/api\/v1\/map\/named\/[a-zA-Z0-9_]+\?api_key=.*}
    end
  end

  def named_maps_url(user_api_key)
    "http://127.0.0.1:#{tiler_port}/api/v1/map/named?api_key=#{user_api_key}"
  end

  def named_map_url(template_id, user_api_key)
    "http://127.0.0.1:#{tiler_port}/api/v1/map/named/#{template_id}?api_key=#{user_api_key}"
  end

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
  def create_private_table_with_public_visualization(template_data,
      visualization_privacy = CartoDB::Visualization::Member::PRIVACY_PUBLIC)

    #Tables/canonical vis also nave named maps
    new_template_body = { template_id: 'tpl_fakeid' }
    Typhoeus.stub( named_maps_url(@user.api_key) )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( new_template_body ) )
            )
    table = create_table( user_id: @user.id, privacy: UserTable::PRIVACY_PRIVATE)
    derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy
    derived_vis.privacy = visualization_privacy
    template_id = CartoDB::NamedMapsWrapper::NamedMap.template_name(derived_vis.id)

    Typhoeus.stub( tiler_regex )
            .and_return(
              Typhoeus::Response.new(code: 404, body: '')
            )
    # Stub all petitions, not just GET
    Typhoeus.stub( named_maps_url(@user.api_key) )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_id: template_id ) )
            )

    derived_vis.store
    collection  = Visualization::Collection.new.fetch
    collection.add(derived_vis)
    collection.store

    template_data[:template][:name] = template_id

    Typhoeus::Expectation.clear
    # Retrievals
    Typhoeus.stub( named_map_url(template_id, @user.api_key),
      { method: :get} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )

    # Updates
    Typhoeus.stub( named_map_url(template_id, @user.api_key),
        { method: :put} )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
              )

    # Vizjson uses the public endpoint, so stub it too
    Typhoeus.stub( "http://#{@user.username}.localhost.lan:#{public_tiler_port}/tiles/template/#{template_id}?api_key=#{@user.api_key}",
      { method: :get} )
            .and_return(
              Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
            )

    return table, derived_vis, template_id
  end
end
