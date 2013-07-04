# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class Ogr2ogr
      ENCODING  = 'UTF-8'
      SCHEMA    = 'importer'

      def initialize(table_name, filepath, pg_options, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.options    = options
      end #initialize

      def command
        "#{encoding_option} #{executable_path} "        +
        "#{cartodb_id_option} "                         +
        "#{output_format_option} #{postgres_options} "  +
        "#{filepath} #{layer_name_option}"
      end #command

      def cartodb_id_option
        option = "-lco FID=cartodb_id"
        option.prepend('-preserve_fid ') if preserve_cartodb_id?
        option
      end #cartodb_id_option

      def executable_path
        `which ogr2ogr`.strip
      end #executable_path

      def preserve_cartodb_id?
        options.fetch(:preserve_cartodb_id, false)
      end #preserve_cartodb_id?

      def run(*args)
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i
        self
      end #run

      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :options, :table_name

      def output_format_option
        "-f PostgreSQL"
      end #output_format_option

      def encoding_option
       "PGCLIENTENCODING=#{ENCODING}"
      end #encoding_option

      def layer_name_option
        "-nln #{table_name}"
      end #layer_name_option

      def postgres_options
        %Q{PG:"host=#{pg_options.fetch(:host)} }    +
        %Q{port=#{pg_options.fetch(:port)} }        +
        %Q{user=#{pg_options.fetch(:user)} }        +
        %Q{dbname=#{pg_options.fetch(:database)} }  +
        %Q{active_schema=#{SCHEMA}"}
      end #postgres_options
    end # Ogr2ogr
  end # Importer2
end # CartoDB

