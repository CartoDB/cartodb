# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class NoPrjAvailable < StandardError; end

    class Shp2pgsql
      ENCODING  = 'UTF-8'
      SCHEMA    = 'importer'

      def initialize(table_name, filepath, pg_options, options={})
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.options    = options
      end #initialize

      def command
      end #command

      def executable_path
        `which shp2pgsql`.strip
      end #executable_path

      def run(*args)
        raise NoPrjAvailable unless prj?
        #stdout, stderr, status  = Open3.capture3(command)
        #self.command_output     = stdout + stderr
        #self.exit_code          = status.to_i
        #self
      end #run

      def prj?
        File.exists?(filepath.gsub(%r{\.shp$}, '.prj'))
      end #prj?

      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :options, :table_name

      def statement_timeout
        "echo 'set statement_timeout=600000;';"
      end #statement_timeout
    end # Shp2pgsql
  end # Importer2
end # CartoDB

