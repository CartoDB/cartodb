# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../app/models/visualization/member'
require_relative '../../../services/data-repository/repository'
require_relative '../../factories/organizations_contexts'

include CartoDB

describe Visualization::Member do
  include_context 'organization with users helper'

  before(:each) do
    bypass_named_maps
  end

  describe 'sharing tables and visualizations' do

    it 'should give read permission to table aka canonical visualization' do
      owner_table = create_table(@org_user_owner)
      carto_canonical_vis = owner_table.table_visualization
      canonical_vis = CartoDB::Visualization::Member.new(id: carto_canonical_vis.id).fetch

      canonical_vis.has_permission?(@org_user_owner, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      canonical_vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false

      give_permission(canonical_vis, @org_user_1, CartoDB::Permission::ACCESS_READONLY)

      canonical_vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
    end

    it 'other user should not have permission until given' do
      owner_table = create_table(@org_user_owner)
      carto_vis = create_vis_from_table(owner_table.table_visualization.user, owner_table)
      vis = CartoDB::Visualization::Member.new(id: carto_vis.id).fetch
      vis.has_permission?(@org_user_owner, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false

      give_permission(vis, @org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY)

      vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
    end

    it 'other user will not get permission in private table when the table owners adds it to the visualization' do
      owner_table = create_table(@org_user_owner)
      carto_vis = create_vis_from_table(owner_table.table_visualization.user, owner_table)
      vis = CartoDB::Visualization::Member.new(id: carto_vis.id).fetch
      give_permission(vis, @org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY)
      vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true

      other_table = create_table(@org_user_owner)
      other_vis = CartoDB::Visualization::Member.new(id: other_table.table_visualization.id).fetch
      add_layer_from_table(vis, other_table)

      vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      other_vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false
    end

    it 'should not remove access to visualization if table privacy is changed to private' do
      owner_table = create_table(@org_user_owner)
      carto_canonical_vis = owner_table.table_visualization
      canonical_vis = CartoDB::Visualization::Member.new(id: carto_canonical_vis.id).fetch
      carto_vis = create_vis_from_table(owner_table.table_visualization.user, owner_table)
      vis = CartoDB::Visualization::Member.new(id: carto_vis.id).fetch
      give_permission(vis, @org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY)

      # removes access to table
      canonical_vis.permission.clear

      canonical_vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false
      vis.has_permission?(@org_user_1, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
    end


  end

  private

  def add_layer_from_table(vis, table)
    layer = Layer.create(layer_params(table).slice(:kind, :options, :infowindow, :tooltip, :order))
    vis.map.add_layer(layer)
    layer.register_table_dependencies
    vis.map.process_privacy_in(layer)
  end

  def create_vis_from_table(user, table)
    blender = Visualization::TableBlender.new(user, [table])
    map = blender.blend
    vis = Visualization::Member.new(
        name:     'wadus_vis',
        map_id:   map.id,
        type:     Visualization::Member::TYPE_DERIVED,
        privacy:  blender.blended_privacy,
        user_id:  user.id
    )
    vis.store

    vis
  end

  def give_permission(vis, user, access)
    per = vis.permission
    per.set_user_permission(user, access)
    per.save
    per.reload
  end

  # @return [CartoDB::Visualization::Member]
  def create_table(user)
    table = Table.new
    table.user_id = user.id
    table.name = 'wadus_table_' + UUIDTools::UUID.timestamp_create.to_s
    table.save
    table.reload

    # table = create_table(user_id: user.id, name: 'wadus_table')
    table.table_visualization.type.should eq Visualization::Member::TYPE_CANONICAL

    table
  end

  def layer_params(table)
    {
        :kind => "carto",
        :options => {
            :attribution => 'CartoDB',
            :type => 'CartoDB',
            :active => true,
            :query => '',
            :opacity => 0.99,
            :interactivity => 'cartodb_id',
            :interaction => true,
            :debug => false,
            :tiler_domain => 'localhost.lan',
            :tiler_port => '8181',
            :tiler_protocol => 'http',
            :sql_api_domain => 'localhost.lan',
            :sql_api_port => 8080,
            :sql_api_protocol => 'http',
            :extra_params => {
                :cache_policy => 'persist',
                :cache_buster => 1404930437358
            },
            :maxZoom => 28,
            :auto_bound => false,
            :visible => true,
            :sql_domain => 'localhost.lan',
            :sql_port => '80',
            :sql_protocol => 'http',
            :tile_style_history => ["##{table.name}{ line-color: #FF6600; line-width: 2; line-opacity: 0.7; }"],
            :style_version => '2.1.1',
            :table_name => table.name,
            :user_name => 'foo',
            :tile_style => "##{table.name}{ line-color: #FF6600; line-width: 2; line-opacity: 0.7; }",
            :use_server_style => true,
            :query_history => [],
            :wizard_properties => {
                :type => 'polygon',
                :properties => {
                    'line-width' => 2,
                    'line-color' => '#FF6600',
                    'line-opacity' => 0.7,
                    'line-comp-op' => 'none',
                    'text-name' => 'None',
                    'text-face-name' => 'DejaVu Sans Book',
                    'text-size' => 10,
                    'text-fill' => '#000',
                    'text-halo-fill' => '#FFF',
                    'text-halo-radius' => 1,
                    'text-dy' => -10,
                    'text-allow-overlap' => true,
                    'text-placement-type' => 'dummy',
                    'text-label-position-tolerance' => 0,
                    'text-placement' => 'point',
                    'geometry_type' => 'line'
                }
            },
            :tile_style_custom => false,
            :query_wrapper => nil,
            :query_generated => false,
            :order => 2,
            :stat_tag => table.id,
            :sql_api_endpoint => '/api/v1/sql',
            :no_cdn => true,
            :force_cors => true
        },
        :infowindow => {
            :template_name => 'table/views/infowindow_light',
            :fields => []
        },
        :tooltip => {
            :fields => []
        },
        :order => 2
    }
  end
end
