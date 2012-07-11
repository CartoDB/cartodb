# coding: UTF-8

require File.expand_path(File.dirname(__FILE__) + '/../acceptance_helper')

feature "API 1.0 tables export" do

  background do
    Capybara.current_driver = :rack_test
    @user = create_user

    @data_import = DataImport.create(:queue_id => '',
      :user_id => @user.id,
      :data_source => "/../spec/support/data/elecciones2008.csv",
      :updated_at => Time.now)
    @table = Table[@data_import.table_id]
  end

  scenario "Get table in CSV format" do
    get "#{api_table_export_to_csv_url(@table.name)}" do |response|
      response.status.should == 200 
    end
    
    csv = CSV.parse(response.body)
    debugger
    csv.first.should == ['id','name of species','kingdom','family','lat','lon','views']
  end

  scenario "Get table in SHP format" do
    get "#{api_table_export_to_shp_url(@table.name)}"
    response.status.should == 200
    
    path = "/tmp/temp_shp.zip"
    fd = File.open(path,'w+')
    fd.write(response.body)
    fd.close
    Zip::ZipFile.foreach(path) do |entry|
      %W{ import_csv_1_export.shx import_csv_1_export.shp import_csv_1_export.dbf import_csv_1_export.prj }.should include(entry.name)
    end
    FileUtils.rm_rf(path)
  end
  
end