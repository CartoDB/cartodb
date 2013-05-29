# encoding: utf-8

module CartoDB
  module Importer
    class Ogr2ogr
      def run(*args)
        return 0
      end #run
      #ogr2ogr_binary_path  = `which ogr2ogr`.strip
      #ogr2ogr_command   = 
      #  %Q{PGCLIENTENCODING=#{encoding} #{ogr2ogr_bin_path} } +
      #  %Q{-lco FID=cartodb_id -f "PostgreSQL" } +  
      #  %Q{PG:"host=#{db_configuration[:host]} } +
      #  %Q{port=#{db_configuration[:port]} } +
      #  %Q{user=#{db_configuration[:username]} } +
      #  %Q{dbname=#{db_configuration[:database]}" } +
      #  %Q{#{path} -nln #{suggested_name}}
    end # Ogr2ogr
  end # Importer
end # CartoDB

