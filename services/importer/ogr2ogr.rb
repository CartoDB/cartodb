# encoding: utf-8

module CartoDB
  module Importer
    class Ogr2ogr
      ENCODING = 'UTF-8'

      def initialize(filepath, prefix=nil)
        self.filepath = filepath
        self.prefix   = prefix
      end #initialize

      def run(*args)
        return 0
      end #run

      def command
        "#{encoding_option} #{executable_path} -lco " +
        "#{output_format_option} #{postgres_options} " +
        "#{layer_name_option} #{filepath}"
      end #command

      def executable_path
        `which ogr2ogr`.strip
      end #executable_path

      def output_name
        [prefix, File.basename(filepath)].compact.join('_')
      end #output_name

      private

      attr_accessor :filepath, :prefix

      def output_format_option
        "-f PostgreSQL"
      end #output_format_option

      def encoding_option
       "PGCLIENTENCODING=#{ENCODING}"
      end #encoding_option

      def layer_name_option
        "-nln #{output_name}"
      end #layer_name_option

      def postgres_options
        %Q{PG:"host=#{db_configuration[:host]} }    +
        %Q{port=#{db_configuration[:port]} }        +
        %Q{user=#{db_configuration[:username]} }    +
        %Q{dbname=#{db_configuration[:database]}" }
      end #postgres_options
    end # Ogr2ogr
  end # Importer
end # CartoDB

