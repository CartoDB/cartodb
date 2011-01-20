require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Tables JSON API" do

  scenario "Retrieve different pages of rows from a table" do

    user = create_user
    table = create_table :user_id => user.id

    user.in_database do |user_database|
      user_database.alter_table(table.db_table_name) do
        add_primary_key :identifier
        add_column :c1, String
        add_column :c2, Float
        add_column :c3, String, :text => true
      end
    end

    100.times do
      table.execute_sql("INSERT INTO #{table.db_table_name} (c1,c2,c3) VALUES ('#{String.random(10)}',#{rand(1000000.0)},'#{String.random(100)}')")
    end

    login_as user

    get_json "/api/json/table/#{table.id}?per_page=10"

    # last_response.should be_ok

    # get_json "/api/json/table/#{table.id}?per_page=10&page=1"
    #
    # get_json "/api/json/table/#{table.id}?per_page=30&page=20"
    #
    # get_json "/api/json/table/#{table.id}?per_page=300&page=20"
  end

end
