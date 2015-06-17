# encoding: utf-8

module CartoDB
  class AbstractTableGeocoder

    def initialize(arguments)
      @connection  = arguments.fetch(:connection)
      @table_name  = arguments[:table_name]
      @table_schema  = arguments[:table_schema]
      @qualified_table_name = arguments[:qualified_table_name]
      @sequel_qualified_table_name = arguments[:sequel_qualified_table_name]
      @schema = arguments[:schema] || 'cdb'
      @state = 'submitted'
    end

    def add_georef_status_column
      connection.run(%Q{
          ALTER TABLE #{@qualified_table_name}
          ADD COLUMN cartodb_georef_status BOOLEAN DEFAULT NULL
        })
    rescue Sequel::DatabaseError => e
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
