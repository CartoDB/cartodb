require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Tables JSON API" do

  scenario "Retrieve different pages of rows from a table" do
    Capybara.current_driver = :rack_test

    user = create_user
    table = create_table :user_id => user.id

    100.times do
      table.execute_sql("INSERT INTO #{table.db_table_name} (Name,Location,Description) VALUES ('#{String.random(10)}','#{rand(1000000.0)}','#{String.random(100)}')")
    end

    content = table.execute_sql("select * from #{table.db_table_name}")

    login_as user

    get_json "/api/json/table/#{table.id}?rows_per_page=2"
    page.driver.last_response.should be_ok
    json_response = JSON(page.body)
    json_response['total_rows'].should == 100
    json_response['rows'][0].symbolize_keys.should == content[0]
    json_response['rows'][1].symbolize_keys.should == content[1]

    get_json "/api/json/table/#{table.id}?rows_per_page=2&page=2"
    page.driver.last_response.should be_ok
    json_response = JSON(page.body)
    json_response['rows'][0].symbolize_keys.should == content[2]
    json_response['rows'][1].symbolize_keys.should == content[3]
  end

end
