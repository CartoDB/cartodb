# encoding: utf-8

require_relative 'exceptions'
require 'active_support/core_ext/numeric'

module CartoDB
  class AbstractTableGeocoder

    DB_STATEMENT_TIMEOUT_MS = 5.hours.to_i * 1000

    def initialize(arguments)
      @connection  = arguments.fetch(:connection)
      @table_name  = arguments[:table_name]
      @table_schema  = arguments[:table_schema]
      @qualified_table_name = arguments[:qualified_table_name]
      @sequel_qualified_table_name = arguments[:sequel_qualified_table_name]
      @schema = arguments[:schema] || 'cdb'
      @state = 'submitted'
      @connection.run("SET statement_timeout TO #{DB_STATEMENT_TIMEOUT_MS}")
    end

    # INFO: it's the table_geocoder owner's responsibility to call this method when done
    def reset_connection
      if @connection
        @connection.run('SET statement_timeout TO DEFAULT')
        @connection = nil
      end
    end

    def add_georef_status_column
      connection.run(%Q{
          ALTER TABLE #{@qualified_table_name}
          ADD COLUMN cartodb_georef_status BOOLEAN DEFAULT NULL
        })
    rescue Sequel::DatabaseError => e
      if e.message =~ /canceling statement due to statement timeout/
        raise Carto::GeocoderErrors::AddGeorefStatusColumnDbTimeoutError.new
      end
      raise unless e.message =~ /column .* of relation .* already exists/
      cast_georef_status_column
    end

    def cancel
      raise 'Not implemented'
    end

    def run
      raise 'Not implemented'
    end

    def remote_id
      raise 'Not implemented'
    end

    def update_geocoding_status
      raise 'Not implemented'
    end

    def process_results
      raise 'Not implemented'
    end

    def used_batch_request?
      false
    end


    private

    def cast_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{@qualified_table_name} ALTER COLUMN cartodb_georef_status
        TYPE boolean USING cast(cartodb_georef_status as boolean)
      })
    rescue => e
      raise "Error converting cartodb_georef_status to boolean, please, convert it manually or remove it."
    end

  end
end
