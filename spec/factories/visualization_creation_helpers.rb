# encoding: utf-8

require_relative '../spec_helper'
require_relative '../support/factories/tables'

include CartoDB

def app
  CartoDB::Application.new
end

shared_context 'visualization creation helpers' do

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
    @headers = {
      'CONTENT_TYPE'  => 'application/json',
      'HTTP_HOST'     => 'test.localhost.lan'
    }
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

  def create_random_table(user, name = "viz#{rand(999)}")
    create_table( { user_id: user.id, name: name } )
  end

  def factory(user, attributes={})
    {
      name:                     attributes.fetch(:name, "visualization #{rand(9999)}"),
      tags:                     attributes.fetch(:tags, ['foo', 'bar']),
      map_id:                   attributes.fetch(:map_id, ::Map.create(user_id: user.id).id),
      description:              attributes.fetch(:description, 'bogus'),
      type:                     attributes.fetch(:type, 'derived'),
      privacy:                  attributes.fetch(:privacy, 'public'),
      source_visualization_id:  attributes.fetch(:source_visualization_id, nil),
      parent_id:                attributes.fetch(:parent_id, nil),
      locked:                   attributes.fetch(:locked, false),
      prev_id:                  attributes.fetch(:prev_id, nil),
      next_id:                  attributes.fetch(:next_id, nil)
    }
  end

end
