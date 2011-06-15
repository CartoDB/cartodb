# coding: UTF-8

Dir[File.expand_path("spec/support/**/*.rb")].each {|f| require f}

RSpec.configure do |config|
  config.mock_with :mocha
  
  config.before(:each) do
    CartoDB::DatabaseConnection.connection.tables.each do |t| 
      next if %W{ geography_columns geometry_columns spatial_ref_sys }.include?(t.to_s)
      CartoDB::DatabaseConnection.connection.drop_table(t)
    end
  end
end
