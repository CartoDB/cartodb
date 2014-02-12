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

      # table_name

      table = create_table( user_id: @user.id )

      derived_vis = CartoDB::Visualization::Copier.new(@user, table.table_visualization).copy()
      derived_vis.privacy = CartoDB::Visualization::Member::PUBLIC

      Typhoeus.stub( %r{http:\/\/[a-z0-9]+\.localhost\.lan:8181\/tiles\/template\/[a-zA-Z0-9_]+\?api_key=.*} )
              .and_return(
                Typhoeus::Response.new(code: 404, body: "")
              )
      Typhoeus.stub( "http://#{@user.username}.localhost.lan:8181/tiles/template?api_key=#{@user.api_key}" )
              .and_return(
                Typhoeus::Response.new( code: 200, body: JSON::dump( template_id: 'tpl_fakeid' ) )
              )

      derived_vis.store()
      collection  = Visualization::Collection.new.fetch()
      collection.add(derived_vis)
      collection.store()

      template_id = CartoDB::NamedMapsWrapper::NamedMap.normalize_name(derived_vis.id)
      template_data[:template][:name] = template_id

      Typhoeus::Expectation.clear()
      Typhoeus.stub( %r{http:\/\/[a-z0-9]+\.localhost\.lan:8181\/tiles\/template\/[a-zA-Z0-9_]+\?api_key=.*} )
              .and_return(
                Typhoeus::Response.new(code: 200, body: JSON::dump( template_data )) 
              )


      #derived_vis.map.add_layer(derived_vis.map.layers.map)

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

      Typhoeus::Expectation.clear()
      Typhoeus.stub( "http://#{@user.username}.localhost.lan:8181/tiles/template/#{template_id}?api_key=#{@user.api_key}" )
                .and_return(
                  Typhoeus::Response.new( code: 200, body: JSON::dump( template_data ) )
                )

      vizjson = derived_vis.to_vizjson()

      vizjson.include?(:id).should eq true
      vizjson.include?(:version).should eq true
      vizjson.include?(:title).should eq true
      vizjson.include?(:description).should eq true
      vizjson.include?(:layers).should eq true

      # TODO: Finish detecting fields
      pending

    end
  end #only_torque_layer

end
