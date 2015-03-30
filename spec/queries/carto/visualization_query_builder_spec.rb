# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::VisualizationQueryBuilder do
  include Rack::Test::Methods
  include Warden::Test::Helpers
  include_context 'visualization creation helpers'

  before(:each) do
    @vqb = Carto::VisualizationQueryBuilder.new
  end

  def query_first_vis_username
    @vqb.build.first.user.username
  end

  it 'searches for all visualizations' do
    table = create_table(@user1)
    table_visualization = table.table_visualization
    table_visualization.store
    @vqb.build.map(&:id).should include table_visualization.id
  end

  it 'searches for all visualizations for a user' do
    table1 = create_table(@user1)
    table2 = create_table(@user2)
    table_visualization1 = table1.table_visualization
    table_visualization1.store
    table_visualization2 = table2.table_visualization
    table_visualization2.store
    ids = @vqb.with_user_id(@user1.id).build.map(&:id)
    ids.should include table_visualization1.id
    ids.should_not include table_visualization2.id
  end

  it 'can prefetch user' do
    table1 = create_table(@user1)

    # INFO: 'warm up' of Rails metadata queries
    query_first_vis_username

    expect {
      query_first_vis_username.should_not eq nil
    }.to make_database_queries(count: 2)

    expect {
      @vqb.with_join_prefetch_of(:user).build.first.user.username.should_not eq nil
    }.to make_database_queries(count: 1)
  end

  it 'searches for shared visualizations' do
    table = create_table(@user1)
    shared_visualization = table.table_visualization
    shared_entity = CartoDB::SharedEntity.new(
      recipient_id:   @user2.id,
      recipient_type: CartoDB::SharedEntity::RECIPIENT_TYPE_USER,
      entity_id:      shared_visualization.id,
      entity_type:    CartoDB::SharedEntity::ENTITY_TYPE_VISUALIZATION
    )
    shared_entity.save
    vq = @vqb.with_visualizations_shared_with(@user2.id)
    vq.build.all.map(&:id).should include(shared_visualization.id)
  end

end
