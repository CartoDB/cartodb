# encoding: utf-8

require_relative '../../spec_helper'

describe Carto::VisualizationQueryBuilder do
  include Rack::Test::Methods
  include Warden::Test::Helpers

  before(:all) do
    @user1 = create_user(
      username: 'test',
      email: 'client@example.com',
      password: 'clientex'
    )

    @user2 = create_user(
      username: 'test2',
      email: 'client2@example.com',
      password: 'clientex2'
    )
  end

  before(:each) do
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    @user1.destroy
    @user2.destroy
  end

  before(:each) do
    db_config   = Rails.configuration.database_configuration[Rails.env]
    @db         = Sequel.postgres(
                    host:     db_config.fetch('host'),
                    port:     db_config.fetch('port'),
                    database: db_config.fetch('database'),
                    username: db_config.fetch('username')
                  )
    @repository = DataRepository::Backend::Sequel.new(@db, :visualizations)
    CartoDB::Visualization.repository = @repository
  end

  def create_table(user, name = "viz#{rand(999)}")
    table = Table.new
    table.user_id = user.id
    table.name = name
    table.save
  end

  before(:each) do
    @vqb = Carto::VisualizationQueryBuilder.new
  end

  it 'searches for all visualizations' do
    table = create_table(@user1, 'kk')
    table_visualization = table.table_visualization
    table_visualization.store
    @vqb.build.map(&:id).should include table_visualization.id
  end

  it 'searches for all visualizations for a user' do
    table1 = create_table(@user1, 'kk1')
    table2 = create_table(@user2, 'kk2')
    table_visualization1 = table1.table_visualization
    table_visualization1.store
    table_visualization2 = table2.table_visualization
    table_visualization2.store
    ids = @vqb.with_user_id(@user1.id).build.map(&:id)
    ids.should include table_visualization1.id
    ids.should_not include table_visualization2.id
  end

  it 'searches for shared visualizations' do
    table = create_table(@user1, 'kk')
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
