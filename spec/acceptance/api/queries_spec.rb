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
    @table.name = "antantaric_species"
    @table.save
  end

  scenario "Perform a SELECT query paginating the results" do
    get_json api_query_url, :sql => "select * from #{@table.name} limit 10", :rows_per_page => 5, :page => 0 do |response|
      response.status.should be_success
      response.body[:total_rows].should == 10
      response.body[:rows][0].symbolize_keys[:name_of_species].should == "nutrix"
      response.body[:rows][1].symbolize_keys[:name_of_species].should == "laevis"
    end
    get_json api_query_url, :sql => "select * from #{@table.name} limit 10", :rows_per_page => 5, :page => 1 do |response|
      response.status.should be_success
      response.body[:total_rows].should == 10
      response.body[:rows][0].symbolize_keys[:name_of_species].should == "cincinnatus"
      response.body[:rows][1].symbolize_keys[:name_of_species].should == "Laetmonice producta 6"
    end
  end
  
  scenario "Perform a SELECT query" do
    get_json api_query_url, :sql => "select * from #{@table.name} where family='Polynoidae' limit 10" do |response|
      response.status.should be_success
      response.body[:total_rows].should == 2
      response.body[:rows][0].symbolize_keys[:name_of_species].should == "Barrukia cristata"
      response.body[:rows][1].symbolize_keys[:name_of_species].should == "Eulagisca gigantea"
    end
  end

  scenario "Perform an UPDATE query" do
    get_json api_query_url, :sql => "update #{@table.name} set family='polynoidae' where family='Polynoidae'"  do |response|
      response.status.should be_success
    end

    get_json api_query_url, :sql => "select * from #{@table.name} where family='Polynoidae' limit 10" do |response|
      response.status.should be_success
      response.body[:total_rows].should == 0
    end

    get_json api_query_url, :sql => "select * from #{@table.name} where family='polynoidae' limit 10" do |response|
      response.status.should be_success
      response.body[:total_rows].should == 2
    end
  end

  scenario "Perform a query using JSONP and api key authorization" do
    Capybara.current_driver = :selenium

    api_key  = @user.create_key "example.org"
    api_key2 = @user.create_key "127.0.0.1"

    FileUtils.cp("#{Rails.root}/spec/support/test_jsonp.html", "#{Rails.root}/public/")

    visit "/test_jsonp.html?api_key=#{api_key2.api_key}"

    page.find("div#results").text.should == "Barrukia cristata"

    FileUtils.rm("#{Rails.root}/public/test_jsonp.html")
  end
  
  scenario "Perform an empty query should raise an error" do
    get_json api_query_url, :sql => nil do |response|
      response.status.should_not be_success
    end
  end
  
  scenario "Perfom a query should enque a threshold analyzer job" do
    expect {
      get_json api_query_url, :sql => "select * from #{@table.name} where family='Polynoidae' limit 10"
    }.to change{Resque.size("queries_threshold")}.from(0).to(1)  
  end

end