# # coding: UTF-8
# 
# require 'spec_helper'
# 
# describe CartoDB::Exporter do
#   describe "#CSV" do
#     it "should export a ZIP archive containing a CSV file to the /tmp directory named with a unique string" do
#       importer = CartoDB::Importer.new :import_from_file => File.expand_path("../support/data/clubbing.csv", __FILE__),
#                                        :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                        :host => 'localhost', :port => 5432
#       run = importer.import!
#       
#       exporter = CartoDB::Exporter.new :export_to_file => 'clubbing', 
#                                        :type => 'csv',
#                                        :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                        :host => 'localhost', :port => 5432
#     
#       result = exporter.export!
#       result.name.should == 'clubbing'
#       result.import_type.should == '.csv'
#     end
#   end
#   describe "#KML" do
#     it "should export a KMZ file to the /tmp directory named with a unique string" do
#       importer = CartoDB::Importer.new :import_from_file => File.expand_path("../support/data/clubbing.csv", __FILE__),
#                                        :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                        :host => 'localhost', :port => 5432
#       run = importer.import!
# 
#       exporter = CartoDB::Exporter.new :export_to_file => 'clubbing', 
#                                        :type => 'kml',
#                                        :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                        :host => 'localhost', :port => 5432
# 
#       result = exporter.export!
#       result.name.should == 'clubbing'
#       result.import_type.should == '.kml'
#     end
#   end
#   describe "#SHP" do
#     it "should export a SHP file set as a ZIP to the /tmp directory named with a unique string" do
# 
#       importer = CartoDB::Importer.new :import_from_file => File.expand_path("../support/data/EjemploVizzuality.zip", __FILE__),
#                                          :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                          :host => 'localhost', :port => 5432
#       run = importer.import!
# 
#       exporter = CartoDB::Exporter.new :export_to_file => 'vizzuality_shp', 
#                                        :type => 'shp',
#                                        :database => "cartodb_importer_test", :username => 'postgres', :password => '',
#                                        :host => 'localhost', :port => 5432
# 
#       result = exporter.export!
#       result.name.should == 'vizzuality_shp'
#       result.import_type.should == '.shp'
#     end
#   end
# end
