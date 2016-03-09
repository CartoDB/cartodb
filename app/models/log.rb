# encoding: utf-8

module CartoDB
  # Motivation: Logs usually are quite small, but in some scenarios, or due to encoding errors, parsing errors, etc.
  # they can grow and even end with 1 line per source row. Thus the need of having a log that hits as less as possible
  # the DB, and that stores critical parts of the log events; this is, the beggining (data recognized, etc.) and the end
  # (how it ended, and last 'errored rows' if present). The middle area is not important and for small logs will still
  # be included
  class Log < Sequel::Model

    MAX_ENTRY_LENGTH = 256
    MAX_LOG_ENTRIES = 1000

    ENTRY_POSTFIX = "\n"

    ENTRY_FORMAT = "%s: %s#{ENTRY_POSTFIX}"
    ENTRY_REHYDRATED_FORMAT = "%s#{ENTRY_POSTFIX}"

    HALF_OF_LOG_MARK = '===LOG HALF===\n'
    END_OF_LOG_MARK = '===LOG END==='

    TYPE_DATA_IMPORT     = 'import'
    TYPE_SYNCHRONIZATION = 'sync'
    TYPE_USER_CREATION   = 'user_creation'
    TYPE_GEOCODING       = 'geocoding'

    SUPPORTED_TYPES = [
      TYPE_DATA_IMPORT,
      TYPE_SYNCHRONIZATION,
      TYPE_USER_CREATION,
      TYPE_GEOCODING
    ]

    # @param id Numeric
    # @param type String
    # @param user_id String (uuid)
    # @param created_at DateTime
    # @param updated_at DateTime
    # @param entries String

    def after_initialize
      super

      if (MAX_LOG_ENTRIES < 2 || MAX_LOG_ENTRIES % 2 != 0)
        raise StandardError.new('MAX_LOG_ENTRIES must be greater than 2 and an even number')
      end

      @dirty = true if new?

      clear_entries # Reset internal lists
      rehydrate_entries_from_string(self.entries)  # And now load if proceeds
    end

    def clear
      @dirty = true
    end

    def to_s
      # Just as a safeguard, no real store will be done if there's no data to flush
      # TODO: Check all usages of Log to see if could be removed
      store

      # Extra decoration only for string presentation
      list = @fixed_entries_half
      circular_half = @circular_entries_half.compact
      if circular_half.length > 0
        list = list + [HALF_OF_LOG_MARK]
      end
      list = (list + circular_half + [END_OF_LOG_MARK]).join('')
    end

    def store
      if @dirty
        self.entries = collect_entries
        save
        @dirty = false
      end
    rescue => e
      CartoDB.notify_error("Error appending log, likely an encoding issue",
        {
          error_info: "id: #{id}. #{self.inspect} --------- #{e.backtrace.join}"
        })
      begin
        fix_entries_encoding
        self.save
      rescue => e2
        CartoDB.notify_exception(e2,
          {
            message: "Error saving fallback log info.",
            error_info: "id: #{id}"
          })
        begin
          self.entries = "Previous log entries stripped because of an error, check Rollbar. Id: #{id}\n" +
                         END_OF_LOG_MARK
          self.save
        rescue => e3
          CartoDB.notify_exception(e3,
            {
              message: "Error saving stripped fallback log info.",
              error_info: "id: #{id}"
            })
        end
      end
    end

    # INFO: Does not store log, only appens in-memory
    def append(content, truncate = true, timestamp = Time.now.utc)
      @dirty = true

      content.slice!(MAX_ENTRY_LENGTH..-1) if truncate

      add_to_entries(ENTRY_FORMAT % [ timestamp, content ])
    end

    def append_and_store(content, truncate = true, timestamp = Time.now.utc)
      append(content, truncate, timestamp)
      store
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

    def clear_entries
      @fixed_entries_half = []
      @circular_entries_half = Array.new(half_max_size)
      @circular_index = 0
      ''
    end

    def rehydrate_entries_from_string(source)
      existing_entries = source.nil? ? [] : source.split("#{ENTRY_POSTFIX}")

      # If rehydrated data, assume nothing changed yet
      @dirty = false if existing_entries.length > 0

      @fixed_entries_half = existing_entries.slice!(0, half_max_size)
                                            .map { |entry| ENTRY_REHYDRATED_FORMAT % [entry] }
      @fixed_entries_half = [] if @fixed_entries_half.nil?  # Log was empty

      if (existing_entries.length > 0)
        index = existing_entries.length > half_max_size ? -half_max_size : -existing_entries.length
        @circular_entries_half = existing_entries.slice(index, half_max_size)
                                                 .map { |entry| ENTRY_REHYDRATED_FORMAT % [entry] }
        # Fill circular part
        if @circular_entries_half.length < half_max_size
          @circular_index = @circular_entries_half.length - 1
          @circular_entries_half = @circular_entries_half + Array.new(half_max_size - @circular_entries_half.length)
        end
      end
    end

    def collect_entries
      # INFO: Abusing that join always produces a String to not need to handle nils
      (@fixed_entries_half + @circular_entries_half).join('')
    end

    # INFO: To ease testing
    def half_max_size
      @half_max_entries_size ||= MAX_LOG_ENTRIES / 2
    end

    def fix_entries_encoding
      @fixed_entries_half = @fixed_entries_half.map { |entry|
        entry.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????') unless entry.nil?
      }
      @circular_entries_half = @circular_entries_half.map { |entry|
        entry.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????') unless entry.nil?
      }
      @dirty = true

      self.entries = collect_entries
    end

    def validate
      super
      errors.add(:type, 'unsupported type') unless SUPPORTED_TYPES.include?(self.type)
    end

    def before_save
      super
      self.updated_at = Time.now
    end

  end
end
