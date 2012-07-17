# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tables export" do

  before(:all) do
    Capybara.current_driver = :rack_test
    @user = create_user({:username => 'test'})

    @data_import = DataImport.create(:queue_id => '',
      :user_id => @user.id,
      :data_source => "/../spec/support/data/clubbing.csv",
      :updated_at => Time.now)
    @table = Table[@data_import.table_id]
  end

  scenario "Get table in CSV format" do
    get "#{api_table_export_to_csv_url(@table.name)}" do |response|
      response.status.should == 200 
    end
    path = "/tmp/temp_csv.zip"
    fd = File.open(path,'w+')
    fd.write(response.body)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      entry.name.should == "clubbing_export.csv"
    end
    FileUtils.rm_rf(path)
  end

  scenario "Get table in SHP format" do
    get "#{api_table_export_to_shp_url(@table.name)}" do |response|
      response.status.should == 200
    end
    path = "/tmp/temp_csv.zip"
    fd = File.open(path,'w+')
    fd.write(response.body)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      ['dbf', 'shp', 'shx'].map { |ext| "clubbing_export.#{ext}" }.should include(entry.to_s)
    end
    FileUtils.rm_rf(path)
  end
  
end