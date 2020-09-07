require_relative 'exceptions'
require 'active_support'
require 'active_support/core_ext/numeric'

module CartoDB
  class AbstractTableGeocoder

    DB_STATEMENT_TIMEOUT_MS = 5.hours.to_i * 1000

    attr_reader :connection

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

    def name
      raise 'Not implemented'
    end

    def used_batch_request?
      false
    end

    def reset_cartodb_georef_status
      ensure_georef_status_colummn_valid
      set_georef_status_to_null
    end

    # Makes sure there's a cartodb_georef_status_column and marks all geocodifiable rows with NULL.
    # This is important because otherwise it is hard to track what rows have been processed or not.
    def mark_rows_to_geocode
      ensure_georef_status_colummn_valid
      set_georef_status_from_false_to_null
    end


    protected

    def ensure_georef_status_colummn_valid
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


    private

    def set_georef_status_to_null
      connection.select.from(@sequel_qualified_table_name).update(:cartodb_georef_status => nil)
    end

    def set_georef_status_from_false_to_null
      connection.select.from(@sequel_qualified_table_name).where(:cartodb_georef_status => false).update(:cartodb_georef_status => nil)
    end

    def cast_georef_status_column
      connection.run(%Q{
        ALTER TABLE #{@qualified_table_name} ALTER COLUMN cartodb_georef_status
        TYPE boolean USING cast(cartodb_georef_status as boolean)
      })
    rescue StandardError => e
      raise "Error converting cartodb_georef_status to boolean, please, convert it manually or remove it."
    end

  end
end
