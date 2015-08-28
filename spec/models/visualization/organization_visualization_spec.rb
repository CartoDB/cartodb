# encoding: utf-8
require_relative '../../spec_helper'
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/relocator/relocator'
require_relative '../../../services/relocator/worker'
require_relative '../../../services/relocator/relocator/table_dumper'
require_relative '../../../app/models/visualization/member'
require_relative '../../../services/data-repository/repository'

include CartoDB

describe Visualization::Member do
  before do
    db_config   = Rails.configuration.database_configuration[Rails.env]
    # Why not passing db_config directly to Sequel.postgres here ?
    # See https://github.com/CartoDB/cartodb/issues/421
    db = Sequel.postgres(
        host:     db_config.fetch('host'),
        port:     db_config.fetch('port'),
        database: db_config.fetch('database'),
        username: db_config.fetch('username')
    )
    Visualization.repository  = DataRepository::Backend::Sequel.new(db, :visualizations)

    CartoDB::Relocator::TableDumper.any_instance.stubs(:migrate).returns(nil)
    CartoDB::Relocator::SchemaDumper.any_instance.stubs(:migrate).returns(nil)
    CartoDB::Relocator::Relocation.any_instance.stubs(:compare).returns(nil)

    UserOrganization.any_instance.stubs(:move_user_tables_to_schema).returns(nil)
    CartoDB::TablePrivacyManager.any_instance.stubs(
        :set_from_table_privacy => nil,
        :propagate_to_varnish => nil
    )

    User.any_instance.stubs(
        :enable_remote_db_user => nil,
        :after_create => nil,
        :create_schema => nil,
        :create_public_db_user => nil,
        :set_database_search_path => nil,
        :load_cartodb_functions => nil,
        :set_user_privileges => nil,
        :monitor_user_notification => nil,
        :grant_user_in_database => nil,
        :set_statement_timeouts => nil,
        :set_user_as_organization_member => nil,
        :cartodb_extension_version_pre_mu? => false,
        :rebuild_quota_trigger => nil,
        :setup_schema => nil,
        :grant_publicuser_in_database => nil,
        :move_tables_to_schema => nil
    )

    Organization.all.each { |org|
      org.destroy
    }

    # @owner.create_schema(@owner.username, @owner.database_username)
    # @owner.grant_all_on_user_schema_queries
    # move_user_tables_to_schema(@owner.id)
    # @owner.organization_id = @organization.id
    # @owner.database_schema = @owner.username
    # @organization.owner_id = @owner.id
    # @organization.save
    # @owner.create_public_db_user
    # @owner.set_database_search_path
    # @owner.load_cartodb_functions
    # @owner.set_user_privileges
    # @owner.rebuild_quota_trigger
    # @owner.save
    # @owner.monitor_user_notification
    # @active = true

    @org, @owner_user, @other_user = prepare_organization
  end

  before(:each) do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)
    Table.any_instance.stubs(
        :perform_cartodb_function => nil,
        :update_cdb_tablemetadata => nil,
        :update_table_pg_stats => nil,
        :create_table_in_database! => nil,
        :get_table_id => 1,
        :grant_select_to_tiler_user => nil,
        :cartodbfy => nil,
        :set_the_geom_column! => nil,
        :is_raster? => false
    )
  end

  after do
    @org.destroy
  end

  describe 'sharing tables and visualizations' do

    it 'should give read permission to table aka canonical visualization' do
      owner_table = create_table(@owner_user)
      canonical_vis = owner_table.table_visualization

      canonical_vis.has_permission?(@owner_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      canonical_vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false

      give_permission(canonical_vis, @other_user, CartoDB::Permission::ACCESS_READONLY)

      canonical_vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
    end

    it 'other user should not have permission until given' do
      owner_table = create_table(@owner_user)
      vis = create_vis_from_table(@owner_user, owner_table)
      vis.has_permission?(@owner_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false

      give_permission(vis, @other_user, CartoDB::Visualization::Member::PERMISSION_READONLY)

      vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
    end

    it 'other user will not get permission in private table when the table owners adds it to the visualization' do
      owner_table = create_table(@owner_user)
      vis = create_vis_from_table(@owner_user, owner_table)
      give_permission(vis, @other_user, CartoDB::Visualization::Member::PERMISSION_READONLY)
      vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true

      other_table = create_table(@owner_user)
      add_layer_from_table(vis, other_table)

      vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
      other_table.table_visualization.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false
    end

    it 'should not remove access to visualization if table privacy is changed to private' do
      owner_table = create_table(@owner_user)
      canonical_vis = owner_table.table_visualization
      vis = create_vis_from_table(@owner_user, owner_table)
      give_permission(vis, @other_user, CartoDB::Visualization::Member::PERMISSION_READONLY)

      # removes access to table
      canonical_vis.permission.clear

      canonical_vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq false
      vis.has_permission?(@other_user, CartoDB::Visualization::Member::PERMISSION_READONLY).should eq true
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

  def prepare_organization
    org = create_organization
    user_a = create_user(:quota_in_bytes => 1.megabyte, :table_quota => 400)
    user_org = UserOrganization.new(org.id, user_a.id)
    user_org.promote_user_to_admin
    org.reload

    user_b = create_user(
      :quota_in_bytes => 1.megabyte, :table_quota => 400,
      :organization => org
    )
    org.reload

    #CartoDB::Relocator::Worker.organize(user_b, org)

    user_a.database_name.should eq user_b.database_name

    return org, user_a, user_b
  end

  def create_organization
    organization = Organization.new

    organization.name = 'wadus-org'
    organization.quota_in_bytes = 3.megabytes
    organization.seats = 10
    organization.save

    organization
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
