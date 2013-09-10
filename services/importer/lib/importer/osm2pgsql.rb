# encoding: utf-8
require 'open3'

module CartoDB
  module Importer2
    class Osm2Pgsql
      ALLOWED_CACHE_SIZE = 1024

      def initialize(table_name, filepath, pg_options, options={})
        #{Rails.root.join('config', 'osm2pgsql.style')}
        self.filepath   = filepath
        self.pg_options = pg_options
        self.table_name = table_name
        self.options    = options
      end #initialize

      def command
        "#{executable_path} #{postgres_options} --slim "  +
        "#{style_option} -u -I -C #{ALLOWED_CACHE_SIZE} " +
        "--multi-geometry --latlong -p #{table_name} #{filepath}"
      end #command

      def executable_path
        `which osm2pgsql`.strip
      end #executable_path
        
      def run(*args)
        stdout, stderr, status  = Open3.capture3(command)
        self.command_output     = stdout + stderr
        self.exit_code          = status.to_i

        wait_for_table_present("#{table_name}_line")
        self
      end #run

      attr_reader   :exit_code, :command_output

      private

      attr_writer   :exit_code, :command_output
      attr_accessor :filepath, :pg_options, :options, :table_name

      def data_in?(table_name)
        db[%Q(
          SELECT count(*)
          AS count
          FROM "#{table_name}"
        )].first.fetch(:count) > 0
      end #data_in?

      def style_option
        style = options.fetch(:style, nil)
        return "--style #{style}" if style
        return ""
      end #style_option

      def postgres_options
        %Q(-H #{pg_options.fetch(:host)} )      +
        %Q(-P #{pg_options.fetch(:port)} )      +
        %Q(-U #{pg_options.fetch(:user)} )      +
        %Q(-d #{pg_options.fetch(:database)}) 
      end #postgres_options

      def db
        Sequel.postgres(pg_options)
      end #db

      def wait_for_table_present(table_name, started_at=Time.now)
        sleep 1
        data_in?(table_name)
        self
      rescue => exception
        raise if timeout?(started_at)
        retry
      end #wait_for_table_present

      def timeout?(started_at)
        (Time.now - started_at) > 120
      end #timeout?
    end # Osm2Pgsql
  end # Importer2
end # CartoDB

