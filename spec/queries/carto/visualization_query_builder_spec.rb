# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::VisualizationQueryBuilder do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include_context 'visualization creation helpers'

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
    }.to make_database_queries(count: 2)

    expect {
      @vqb.with_prefetch_user(true).build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 1)
  end

  it 'can prefetch table' do
    table1 = create_random_table(@user1)

    expect {
      @vqb.build.where(id: table1.table_visualization.id).first.table.name
    }.to make_database_queries(count: 2)

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

end
