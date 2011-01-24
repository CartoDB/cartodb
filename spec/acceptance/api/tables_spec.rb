require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "Tables JSON API" do

  background do
    Capybara.current_driver = :rack_test
  end

  scenario "Retrieve different pages of rows from a table" do
    user = create_user
    table = create_table :user_id => user.id

    100.times do
      table.execute_sql("INSERT INTO \"#{table.name}\" (Name,Location,Description) VALUES ('#{String.random(10)}','#{rand(1000000.0)}','#{String.random(100)}')")
    end

    content = table.execute_sql("select * from \"#{table.name}\"")

    authenticate_api user

    get_json "/api/json/table/#{table.id}?rows_per_page=2"
    response.status.should == 200
    json_response = JSON(response.body)
    json_response['total_rows'].should == 100
    json_response['rows'][0].symbolize_keys.should == content[0]
    json_response['rows'][1].symbolize_keys.should == content[1]

    get_json "/api/json/table/#{table.id}?rows_per_page=2&page=1"
    response.status.should == 200
    json_response = JSON(response.body)
    json_response['rows'][0].symbolize_keys.should == content[2]
    json_response['rows'][1].symbolize_keys.should == content[3]
  end

  scenario "Update the privacy status of a table" do
    user = create_user
    table = create_table :user_id => user.id, :privacy => Table::PRIVATE

    table.should be_private

    authenticate_api user

    put_json "/api/json/table/#{table.id}/toggle_privacy"
    response.status.should == 200
    json_response = JSON(response.body)
    json_response['privacy'].should == 'PUBLIC'
    table.reload.should_not be_private

    put_json "/api/json/table/#{table.id}/toggle_privacy"
    response.status.should == 200
    json_response = JSON(response.body)
    json_response['privacy'].should == 'PRIVATE'
    table.reload.should be_private
  end

  scenario "Update the name of a table" do
    user = create_user
    old_table = create_table :user_id => user.id, :privacy => Table::PRIVATE, :name => 'Old table'
    table = create_table :user_id => user.id, :privacy => Table::PRIVATE

    authenticate_api user

    put_json "/api/json/table/#{table.id}/update", {:name => "My brand new name"}
    response.status.should == 200
    table.reload
    table.name.should == "My brand new name"

    put_json "/api/json/table/#{table.id}/update", {:name => ""}
    response.status.should == 400
    json_response = JSON(response.body)
    json_response['errors'].should == ["name can't be blank"]
    table.reload
    table.name.should == "My brand new name"

    put_json "/api/json/table/#{table.id}/update", {:name => "Old table"}
    response.status.should == 400
    json_response = JSON(response.body)
    json_response['errors'].should == ["name and user_id is already taken"]
    table.reload
    table.name.should == "My brand new name"
  end

end
