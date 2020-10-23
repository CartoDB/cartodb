module Carto
  class Log < ActiveRecord::Base

    include ::LoggerHelper

    has_one :data_import, class_name: Carto::DataImport, foreign_key: :logger

    after_initialize :after_initialize_callback

    MAX_ENTRY_LENGTH = 256
    MAX_LOG_ENTRIES = 1000

    ENTRY_POSTFIX = "\n".freeze

    ENTRY_FORMAT = "%s: %s#{ENTRY_POSTFIX}".freeze
    ENTRY_REHYDRATED_FORMAT = "%s#{ENTRY_POSTFIX}".freeze

    HALF_OF_LOG_MARK = "===LOG HALF===\n".freeze
    END_OF_LOG_MARK  = '===LOG END==='.freeze

    TYPE_DATA_IMPORT            = 'import'.freeze
    TYPE_SYNCHRONIZATION        = 'sync'.freeze
    TYPE_USER_CREATION          = 'user_creation'.freeze
    TYPE_GEOCODING              = 'geocoding'.freeze
    TYPE_USER_MIGRATION_EXPORT  = 'user_migration_export'.freeze
    TYPE_USER_MIGRATION_IMPORT  = 'user_migration_import'.freeze
    TYPE_VISUALIZATION_EXPORT   = 'visualization_export'.freeze

    SUPPORTED_TYPES = [
      TYPE_DATA_IMPORT,
      TYPE_SYNCHRONIZATION,
      TYPE_USER_CREATION,
      TYPE_GEOCODING,
      TYPE_USER_MIGRATION_EXPORT,
      TYPE_USER_MIGRATION_IMPORT,
      TYPE_VISUALIZATION_EXPORT
    ].freeze

    # INFO: disable ActiveRecord inheritance column
    self.inheritance_column = :_type

    def after_initialize_callback
      if MAX_LOG_ENTRIES < 2 || MAX_LOG_ENTRIES.odd?
        raise StandardError, 'MAX_LOG_ENTRIES must be greater than 2 and an even number'
      end

      @dirty = true if new_record?

      clear_entries
      rehydrate_entries_from_string(entries)
    end

    def logger
      @logger ||= LogWriter.new(self)
    end

    def self.new_visualization_export
      Carto::Log.new(
        type: TYPE_VISUALIZATION_EXPORT
      )
    end

    def self.new_user_creation
      Carto::Log.new(
        entries: 'New user creation',
        type: TYPE_USER_CREATION
      )
    end

    def self.new_user_migration_export
      Carto::Log.new(
        type: TYPE_USER_MIGRATION_EXPORT
      )
    end

    def self.new_user_migration_import
      Carto::Log.new(
        type: TYPE_USER_MIGRATION_IMPORT
      )
    end

    def self.new_data_import(user_id = nil)
      Carto::Log.new(
        type: TYPE_DATA_IMPORT,
        user_id: user_id
      )
    end

    def self.new_synchronization(user_id = nil)
      Carto::Log.new(
        type: TYPE_SYNCHRONIZATION,
        user_id: user_id
      )
    end

    def self.new_geocoding(user_id = nil)
      Carto::Log.new(
        type: TYPE_GEOCODING,
        user_id: user_id
      )
    end

    def collect_entries
      (@fixed_entries_half + ordered_circular_entries_half).join('')
    end

    def append(content, truncate = true, timestamp = Time.now.utc)
      @dirty = true
      content.slice!(MAX_ENTRY_LENGTH..-1) if truncate
      add_to_entries(format(ENTRY_FORMAT, timestamp, content))
    end

    def append_and_store(content, truncate = true, timestamp = Time.now.utc)
      reload
      # Sync content from other processes. Ie. geocoding cancel
      rehydrate_entries_from_string(entries)
      append(content, truncate, timestamp)
      store
    end

    def append_exception(line, exception:, truncate: true, timestamp: Time.now.utc)
      append("#{line}: #{exception_to_string(exception)}", truncate, timestamp)
    end

    def clear
      @dirty = true
    end

    def store
      if @dirty
        self.entries = collect_entries
        save
        @dirty = false
      end
    rescue StandardError => e
      log_error(message: 'Error appending log, likely an encoding issue', exception: e, log_id: id)
      begin
        fix_entries_encoding
        save
      rescue StandardError => e
        log_error(message: 'Error saving fallback log info.', exception: e, log_id: id)
        begin
          self.entries = "Previous log entries stripped because of an error, check Rollbar. Id: #{id}\n" +
                         END_OF_LOG_MARK
          save
        rescue StandardError => e
          log_error(message: 'Error saving stripped fallback log info.', exception: e, log_id: id)
        end
      end
    end

    def to_s
      # Just as a safeguard, no real store will be done if there's no data to flush
      store

      list = @fixed_entries_half
      circular_half = ordered_circular_entries_half
      list += [HALF_OF_LOG_MARK] if circular_half.any?
      (list + circular_half + [END_OF_LOG_MARK]).join('')
    end

    private

    def add_to_entries(content)
      if @fixed_entries_half.length < half_max_size
        @fixed_entries_half << content
      else
        @circular_entries_half[@circular_index] = content
        @circular_index = (@circular_index + 1) % half_max_size
      end
    end

    def ordered_circular_entries_half
      (@circular_entries_half[@circular_index..-1] + @circular_entries_half[0...@circular_index]).compact
    end

    def rehydrate_entries_from_string(source)
      existing_entries = source.nil? ? [] : source.split(ENTRY_POSTFIX.to_s)

      # If rehydrated data, assume nothing changed yet
      @dirty = false if existing_entries.any?

      @fixed_entries_half = existing_entries.slice!(0, half_max_size)
                                            .map { |entry| format(ENTRY_REHYDRATED_FORMAT, entry) }
      @fixed_entries_half = [] if @fixed_entries_half.nil? # Log was empty

      return if existing_entries.empty?

      index = existing_entries.length > half_max_size ? -half_max_size : -existing_entries.length
      @circular_entries_half = existing_entries.slice(index, half_max_size)
                                               .map { |entry| format(ENTRY_REHYDRATED_FORMAT, entry) }
      # Fill circular part
      if @circular_entries_half.length < half_max_size
        @circular_index = @circular_entries_half.length
        @circular_entries_half += Array.new(half_max_size - @circular_entries_half.length)
      else
        @circular_index = 0
      end
    end

    def clear_entries
      @fixed_entries_half = []
      @circular_entries_half = Array.new(half_max_size)
      @circular_index = 0
      ''
    end

    def exception_to_string(error)
      "#{error.inspect}\n#{error.backtrace.join("\n")}\n"
    end

    def half_max_size
      MAX_LOG_ENTRIES / 2
    end

    def fix_entries_encoding
      @fixed_entries_half = @fixed_entries_half.map do |entry|
        entry&.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
      end
      @circular_entries_half = @circular_entries_half.map do |entry|
        entry&.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
      end
      @dirty = true

      self.entries = collect_entries
    end

    # A logger implementation that logs to this Carto::Log
    class LogWriter < ::Logger

      SAVE_BLOCK = 100 # Save the changes to DB every X lines

      def initialize(log)
        @log = log
        @stored_entries = 0
      end

      def add(_severity, _progname = nil, message = nil)
        return unless message.present?

        @log.append(message.to_s)
        @stored_entries += 1

        return unless @stored_entries >= SAVE_BLOCK

        @stored_entries = 0
        @log.store
      end

      def close
        @log.store
      end

    end

  end
end
