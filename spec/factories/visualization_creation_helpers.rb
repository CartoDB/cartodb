# encoding: utf-8

require_relative '../spec_helper'
require_relative '../support/factories/tables'

include CartoDB

def app
  CartoDB::Application.new
end

shared_context 'visualization creation helpers' do

  before(:all) do
    username1 = random_username
    @user1 = create_user(
      username: username1,
      email: "#{username1}@example.com",
      password: 'clientex'
    )

    username2 = random_username
    @user2 = create_user(
      username: username2,
      email: "#{username2}@example.com",
      password: 'clientex2'
    )
  end

  before(:each) do
    CartoDB::Visualization::Member.any_instance.stubs(:has_named_map?).returns(false)
    delete_user_data @user1
    delete_user_data @user2
  end

  after(:all) do
    @user1.destroy if @user1
    @user2.destroy if @user2
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

  private

  def random_username
    "user#{rand(10000)}"
  end

end
