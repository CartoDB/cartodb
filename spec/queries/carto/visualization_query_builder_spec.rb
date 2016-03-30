# encoding: utf-8

require_relative '../../spec_helper'
require 'helpers/unique_names_helper'

describe Carto::VisualizationQueryBuilder do
  include UniqueNamesHelper
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include_context 'visualization creation helpers'
  include_context 'users helper'

  before(:each) do
    @vqb = Carto::VisualizationQueryBuilder.new

    DBQueryMatchers.configure do |config|
      config.ignores = []
      config.ignores << /SHOW client_min_messages/
      config.ignores << /SET client_min_messages TO 'panic'/
      config.ignores << /SET standard_conforming_strings = on/
      config.ignores << /SET client_min_messages TO 'notice'/
      config.ignores << /SHOW TIME ZONE/
      config.ignores << /SELECT a.attname, format_type(a.atttypid, a.atttypmod), d.adsrc, a.attnotnull/
      config.ignores << /SHOW search_path/
      config.ignores << /LEFT JOIN pg_namespace n ON n.oid = c.relnamespace/
      config.ignores << /INNER JOIN pg_depend dep ON attr.attrelid = dep.refobjid AND attr.attnum = dep.refobjsubid/
      config.ignores << /WHERE a.attrelid = '".*"'::regclass/
    end
  end

  it 'searches for all visualizations' do
    table = create_random_table(@user1)
    table_visualization = table.table_visualization
    table_visualization.store
    @vqb.build.map(&:id).should include table_visualization.id
  end

  it 'searches for all visualizations for a user' do
    table1 = create_random_table(@user1)
    table2 = create_random_table(@user2)
    table_visualization1 = table1.table_visualization
    table_visualization1.store
    table_visualization2 = table2.table_visualization
    table_visualization2.store
    ids = @vqb.with_user_id(@user1.id).build.map(&:id)
    ids.should include table_visualization1.id
    ids.should_not include table_visualization2.id
  end

  it 'can prefetch user' do
    table1 = create_random_table(@user1)

    expect {
      @vqb.build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 2..3)
    # 1: SELECT * FROM visualizations LIMIT 1
    # 2: to select basic user fields
    # 3: AR seems to not be very clever detecting vis.user is already fetched and sometimes re-fetches it

    expect {
      @vqb.with_prefetch_user(true).build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 1)
  end

  it 'can prefetch table' do
    table1 = create_random_table(@user1)

    expect {
      @vqb.build.where(id: table1.table_visualization.id).first.table.name
    }.to make_database_queries(count: 2..3)

    expect {
      @vqb.with_prefetch_table.build.where(id: table1.table_visualization.id).first.table.name
    }.to make_database_queries(count: 1)
  end

  it 'searches for shared visualizations' do
    table = create_random_table(@user1)
    shared_visualization = table.table_visualization
    shared_entity = CartoDB::SharedEntity.new(
      recipient_id:   @user2.id,
      recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id:      shared_visualization.id,
      entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )
    shared_entity.save
    vq = @vqb.with_shared_with_user_id(@user2.id)
    vq.build.all.map(&:id).should include(shared_visualization.id)
  end

  it 'orders using different criteria' do

    table1 = create_random_table(@user1)
    table2 = create_random_table(@user1)
    table3 = create_random_table(@user1)

    # Searches only using query builder itself
    ids = @vqb.with_type(Carto::Visualization::TYPE_CANONICAL)
              .with_order(:updated_at, :desc)
              .build
              .all.map(&:id)
    ids.should == [ table3.table_visualization.id, table2.table_visualization.id, table1.table_visualization.id ]

    # From here on, uses OffdatabaseQueryAdapter

    # Likes

    table1.table_visualization.add_like_from(@user1.id)
    table1.table_visualization.add_like_from(@user2.id)
    table3.table_visualization.add_like_from(@user1.id)

    ids = Carto::VisualizationQueryBuilder.new
                                          .with_type(Carto::Visualization::TYPE_CANONICAL)
                                          .with_order('likes', :desc)
                                          .build
                                          .all.map(&:id)

    puts "#{table1.table_visualization.id} #{table1.table_visualization.likes.count}"
    puts "#{table2.table_visualization.id} #{table2.table_visualization.likes.count}"
    puts "#{table3.table_visualization.id} #{table3.table_visualization.likes.count}"

    ids.should == [ table1.table_visualization.id, table3.table_visualization.id, table2.table_visualization.id ]

    Carto::VisualizationQueryBuilder.new
                                    .with_type(Carto::Visualization::TYPE_CANONICAL)
                                    .with_order('likes', :desc)
                                    .build
                                    .count.should == 3

    # Check with limit
    ids = Carto::VisualizationQueryBuilder.new
                                          .with_type(Carto::Visualization::TYPE_CANONICAL)
                                          .with_order('likes', :desc)
                                          .build
                                          .limit(2)
                                          .all.map(&:id)
    ids.should == [ table1.table_visualization.id, table3.table_visualization.id ]

    # Check with limit AND offset
    ids = Carto::VisualizationQueryBuilder.new
                                          .with_type(Carto::Visualization::TYPE_CANONICAL)
                                          .with_order('likes', :desc)
                                          .build
                                          .offset(1)
                                          .limit(2)
                                          .all.map(&:id)
    ids.should == [ table3.table_visualization.id, table2.table_visualization.id ]

    # Mapviews

    # visualization.mapviews -> visualization.stats -> CartoDB::Visualization::Stats ->
    #   CartoDB::Stats::APICalls.get_api_calls_with_dates
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(@user1.username, {stat_tag: table1.table_visualization.id})
                            .returns({ "2015-04-15" => 1, "2015-04-14" => 0 })
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(@user1.username, {stat_tag: table2.table_visualization.id})
                            .returns({ "2015-04-15" => 333, "2015-04-14" => 666 })
    CartoDB::Stats::APICalls.any_instance.stubs(:get_api_calls_with_dates)
                            .with(@user1.username, {stat_tag: table3.table_visualization.id})
                            .returns({ "2015-04-15" => 12, "2015-04-14" => 20 })

    ids = Carto::VisualizationQueryBuilder.new
                                          .with_type(Carto::Visualization::TYPE_CANONICAL)
                                          .with_order('mapviews', :desc)
                                          .build
                                          .all.map(&:id)
    ids.should == [ table2.table_visualization.id, table3.table_visualization.id, table1.table_visualization.id ]

    # Size

   mocked_vis1 = Carto::Visualization.where(id: table1.table_visualization.id).first
   mocked_vis2 = Carto::Visualization.where(id: table2.table_visualization.id).first
   mocked_vis3 = Carto::Visualization.where(id: table3.table_visualization.id).first

   mocked_vis1.stubs(:size).returns(200)
   mocked_vis2.stubs(:size).returns(1)
   mocked_vis3.stubs(:size).returns(600)

   # Careful to not do anything else on this spec after this size assertions
   ActiveRecord::Relation.any_instance.stubs(:all).returns([ mocked_vis3, mocked_vis1, mocked_vis2 ])

   ids = Carto::VisualizationQueryBuilder.new.with_type(Carto::Visualization::TYPE_CANONICAL)
                                             .with_order('size', :desc)
                                             .build.map(&:id)
   ids.should == [ table3.table_visualization.id, table1.table_visualization.id, table2.table_visualization.id ]

    # NOTE: Not testing with multiple order criteria as currently the editor doesn't supports it so is not needed
  end

  it 'filters remote tables with syncs' do

    stub_named_maps_calls

    table = create_random_table(@user1)

    remote_vis_1 = CartoDB::Visualization::Member.new({
          user_id: @user1.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: @user1.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    remote_vis_2 = CartoDB::Visualization::Member.new({
          user_id: @user1.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: @user1.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    remote_vis_3 = CartoDB::Visualization::Member.new({
          user_id: @user1.id,
          name:    "remote vis #{unique_name('viz')}",
          map_id:  ::Map.create(user_id: @user1.id).id,
          type:    CartoDB::Visualization::Member::TYPE_REMOTE,
          privacy: CartoDB::Visualization::Member::PRIVACY_PRIVATE
        }).store

    external_source_1 = Carto::ExternalSource.new({
      visualization_id: remote_vis_1.id,
      import_url: 'http://test.fake',
      rows_counted: 2,
      size: 12345,
      username: @user1.username,
      })
    external_source_1.save

    external_source_2 = Carto::ExternalSource.new({
      visualization_id: remote_vis_2.id,
      import_url: 'http://test2.fake',
      rows_counted: 4,
      size: 123456,
      username: @user1.username,
      })
    external_source_2.save

    external_source_3 = Carto::ExternalSource.new({
      visualization_id: remote_vis_3.id,
      import_url: 'http://test3.fake',
      rows_counted: 6,
      size: 9999,
      username: @user1.username,
      })
    external_source_3.save

    # Trick: reusing same data import for all 3 external
    data_import_1 = DataImport.create({
      user_id:                @user1.id,
      })

    # Old external data imports don't hide anything

    ExternalDataImport.new(data_import_1.id, external_source_1.id, nil).save
    ExternalDataImport.new(data_import_1.id, external_source_2.id, nil).save
    ExternalDataImport.new(data_import_1.id, external_source_3.id, nil).save

    ids = @vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_3.id, remote_vis_2.id, remote_vis_1.id ]

    # But new ones that have a sync should hide

    sync_1 = CartoDB::Synchronization::Member.new({
      }).store
    ExternalDataImport.new(data_import_1.id, external_source_2.id, sync_1.id).save

    ids = @vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_3.id, remote_vis_1.id ]

    sync_2 = CartoDB::Synchronization::Member.new({
      }).store
    ExternalDataImport.new(data_import_1.id, external_source_3.id, sync_2.id).save

    ids = @vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_1.id ]

    # as there are constraints, deleting the sync should remove the external data import
    sync_1.delete

    ids = @vqb.with_type(Carto::Visualization::TYPE_REMOTE)
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_2.id, remote_vis_1.id ]

    # Searching for multiple types should not hide or show more/less remote tables, neither break search
    ids = @vqb.with_types([ Carto::Visualization::TYPE_CANONICAL, Carto::Visualization::TYPE_REMOTE ])
        .with_order(:updated_at, :desc)
        .without_synced_external_sources
        .build
        .all.map(&:id)
    ids.should == [ remote_vis_2.id, remote_vis_1.id, table.table_visualization.id]

    ExternalDataImport.all { |edi| edi.destroy } # Clean up to avoid foreign key not null violation
  end

  it 'filters raster tables' do
    stub_named_maps_calls

    table = create_random_table(@user1)
    table_visualization = table.table_visualization
    table_visualization.store

    raster_table = create_random_table(@user1)
    raster_table_visualization = raster_table.table_visualization
    raster_table_visualization.kind = CartoDB::Visualization::Member::KIND_RASTER
    raster_table_visualization.store

    visualizations = @vqb.without_raster.build

    visualizations.map(&:id).should include table_visualization.id
    visualizations.map(&:id).should_not include raster_table_visualization.id
  end

  it 'will not accept nil id or name' do
    expect { @vqb.with_id_or_name(nil) }.to raise_error
  end
end
