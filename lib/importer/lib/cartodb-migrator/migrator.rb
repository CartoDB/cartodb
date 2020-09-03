module CartoDB
  class Migrator
    class << self
      attr_accessor :debug
    end
    @@debug = true

    attr_accessor :current_name, :suggested_name, :db_configuration, :db_connection

    attr_reader :table_created, :force_name

    def initialize(options = {})
      @@debug = options[:debug] if options[:debug]
      @table_created = nil

      # Handle name of table and target name of table
      @suggested_name = options[:current_name]
      @current_name = options[:current_name]

      @target_schema = options[:schema]

      raise "current_table value can't be nil" if @current_name.nil?

      # Handle DB connection
      @db_configuration = options.slice :database, :username, :password, :host, :port
      @db_configuration = {:port => 5432, :host => '127.0.0.1'}.merge @db_configuration
      @db_connection = Sequel.connect("postgres://#{@db_configuration[:username]}:#{@db_configuration[:password]}@#{@db_configuration[:host]}:#{@db_configuration[:port]}/#{@db_configuration[:database]}")

      #handle suggested_name
      unless options[:suggested_name].nil? || options[:suggested_name].blank?
        @force_name = true
        @suggested_name = options[:suggested_name]
      else
        @force_name = false
      end

    rescue StandardError => e
      log $!
      log e.backtrace
      raise e
    end

    def migrate!
      # Already done by Table#sanitize_columns in app/models/table.rb
      #sanitize_columns!

      # Rename our table
      if @current_name != @suggested_name
        @db_connection.run("ALTER TABLE #{@current_name} RENAME TO #{@suggested_name}")
        @current_name = @suggested_name
      end

      @table_created = true

      return @suggested_name

    rescue StandardError => e
      log "====================="
      log $!
      log e.backtrace
      log "====================="
      unless @table_created.nil?
        @db_connection.drop_table(@suggested_name)
      end
      raise e
    ensure
      @db_connection.disconnect
    end

    private

    def log(str)
      if @@debug
        puts str
      end
    end

    # Sanitize column names where needed
    def sanitize_columns!
      column_names = @db_connection.schema(@current_name, {:schema => @target_schema}).map{ |s| s[0].to_s }
      sanitize(column_names)
    end


    def sanitize(column_names)
      columns_to_sanitize = column_names.select do |column_name|
        column_name != CartoDB::Importer2::Column.sanitize_name(column_name)
      end

      correct_columns = column_names - columns_to_sanitize

      sanitization_map = Hash[
        columns_to_sanitize.map { |column_name|
          [column_name, CartoDB::Importer2::Column.sanitize_name(column_name)]
        }
      ]

      sanitization_count = 0

      sanitization_map = sanitization_map.inject({}) { |memo, pair|
        if memo.values.include?(pair.last) || correct_columns.include?(pair.last)
          sanitization_count += 1
          memo.merge(pair.first => "#{pair.last}_#{sanitization_count}")
        else
          memo.merge(pair.first => pair.last)
        end
      }

      sanitization_map.each do |unsanitized, sanitized|
        @db_connection.run(%Q{
          ALTER TABLE #{@current_name}
          RENAME COLUMN "#{unsanitized}"
          TO "#{sanitized}"
        })
      end
    end
  end
end
