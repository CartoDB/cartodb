# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::VisualizationQueryBuilder do
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
    }.to make_database_queries(count: 3)

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

end
