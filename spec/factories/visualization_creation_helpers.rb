# encoding: utf-8

require_relative '../spec_helper'

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

  def create_table(user, name = "viz#{rand(999)}")
    table = Table.new
    table.user_id = user.id
    table.name = name
    table.save
  end

end
