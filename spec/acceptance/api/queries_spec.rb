# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 queries interface" do

  background do
    Capybara.current_driver = :rack_test
    @user = create_user
    login_as @user

    @table = new_table
    @table.import_from_file = Rack::Test::UploadedFile.new("#{Rails.root}/db/fake_data/import_csv_1.csv", "text/csv")
    @table.user_id = @user.id
    @table.save
  end

  scenario "Perform a SELECT query" do
    get_json api_query_url, :sql => "select * from #{@table.name} where family='Polynoidae' limit 10"

    parse_json(response) do |r|
      r.status.should be_success
      r.body[:total_rows].should == 2
      r.body[:rows][0].symbolize_keys[:name_of_species].should == "Barrukia cristata"
      r.body[:rows][1].symbolize_keys[:name_of_species].should == "Eulagisca gigantea"
    end
  end

  scenario "Perform an UPDATE query" do
    get_json api_query_url, :sql => "update #{@table.name} set family='polynoidae' where family='Polynoidae'"
    parse_json(response) do |r|
      r.status.should be_success
    end

    get_json api_query_url, :sql => "select * from #{@table.name} where family='Polynoidae' limit 10"
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:total_rows].should == 0
    end

    get_json api_query_url, :sql => "select * from #{@table.name} where family='polynoidae' limit 10"
    parse_json(response) do |r|
      r.status.should be_success
      r.body[:total_rows].should == 2
    end
  end

  pending "Perform a query using JSONP and api key authorization" do
    Capybara.current_driver = :selenium

    api_key  = @user.create_key "example.org"
    api_key2 = @user.create_key "127.0.0.1"

    FileUtils.cp("#{Rails.root}/spec/support/test_jsonp.html", "#{Rails.root}/public/")

    visit "/test_jsonp.html?api_key=#{api_key2.api_key}"

    page.find("div#results").text.should == "Barrukia cristata"

    FileUtils.rm("#{Rails.root}/public/test_jsonp.html")
  end

end
