# encoding: utf-8

module CartoDB
  class Log < Sequel::Model

    MAX_ENTRY_LENGTH = 256
    MAX_LOG_ENTRIES = 1000

    ENTRY_PREFIX = '|'
    ENTRY_POSTFIX = "|\n"

    ENTRY_FORMAT = "#{ENTRY_PREFIX}%s: %s#{ENTRY_POSTFIX}"
    ENTRY_REHYDRATED_FORMAT = "%s#{ENTRY_POSTFIX}"

    TYPE_DATA_IMPORT     = 'import'
    TYPE_SYNCHRONIZATION = 'sync'

    # @param id Numeric
    # @param type String
    # @param user_id String (uuid)
    # @param created_at DateTime
    # @param updated_at DateTime
    # @param entries String

    def after_initialize
      super
      clear_entries # Reset internal lists
      rehydrate_entries_from_string(self.entries)  # And now load if proceeds
    end

    def clear
      self.entries = clear_entries
      @dirty = true
    end

    def to_s
      # Just as a safeguard, no real store will be done if there's no data to flush
      store
      self.entries
    end

    def store
      if @dirty
        self.entries = collect_entries
        save
        @dirty = false
      end
    rescue => e
      Rollbar.report_message("Error appending log, likely an encoding issue", 'error', error_info: "id: #{id}. #{self.inspect} --------- #{e.backtrace.join}")
      begin
        fix_entries_encoding
        self.save
      rescue => e2
        Rollbar.report_message("Error saving fallback log info.", 'error', error_info: "id: #{id} #{e2.backtrace.join}")
        begin
          self.entries = "Previous log entries stripped because of an error, check Rollbar. Id: #{id}"
          self.save
        rescue => e3
          Rollbar.report_message("Error saving stripped fallback log info.", 'error', error_info: "id: #{id} #{e3.backtrace.join}")
        end
      end
    end

    # INFO: Does not store log, only appens in-memory
    def append(content, timestamp = Time.now.utc)
      @dirty = true
      add_to_entries(ENTRY_FORMAT % [ timestamp, content.slice(0..MAX_ENTRY_LENGTH) ])
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
      # A bit hacky but a simple \n would return "false positives"
      existing_entries = source.nil? ? [] : source.split("#{ENTRY_POSTFIX}")

      @fixed_entries_half = existing_entries.slice!(0, half_max_size)
                                            .map { |entry| ENTRY_REHYDRATED_FORMAT % [entry] }

      if (existing_entries.length > 0)
        @circular_entries_half = existing_entries.slice(0, half_max_size)
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
      (@fixed_entries_half + @circular_entries_half.compact).join('')
    end

    # INFO: To ease testing
    def half_max_size
      @half_max_entries_size ||= MAX_LOG_ENTRIES / 2
    end

    # TODO: Adapt this to new format
    def fix_entries_encoding
      self.entries = self.entries.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
    end

    def validate
      super
      errors.add(:type, 'unsupported type') unless (self.type == TYPE_DATA_IMPORT || self.type == TYPE_SYNCHRONIZATION)
    end

    def before_save
      super
      self.updated_at = Time.now
    end

  end
end
