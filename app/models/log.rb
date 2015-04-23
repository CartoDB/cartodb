# encoding: utf-8

module CartoDB
  class Log < Sequel::Model

    ENTRY_FORMAT = "%s: %s\n"

    TYPE_DATA_IMPORT     = 'import'
    TYPE_SYNCHRONIZATION = 'sync'

    # @param id Numeric
    # @param type String
    # @param user_id String (uuid)
    # @param created_at DateTime
    # @param updated_at DateTime
    # @param entries String

    def clear
      self.entries = ''
      save
    end

    def append(content, timestamp = Time.now.utc)
      self.entries = '' if self.entries.nil?
      self.entries << ENTRY_FORMAT % [ timestamp, content ]
      save
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

    def fix_entries_encoding
      self.entries = self.entries.encode('UTF-8', 'binary', invalid: :replace, undef: :replace, replace: '?????')
    end

    def validate
      super
      errors.add(:type, 'unsupported type') unless \
        self.type == TYPE_DATA_IMPORT || self.type == TYPE_SYNCHRONIZATION
    end

    def before_save
      super
      self.updated_at = Time.now
    end

  end
end
