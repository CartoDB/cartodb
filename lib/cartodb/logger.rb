module CartoDB
  class Logger
    def self.info title = "CartoDB Log", message
      Rails.logger.info "[#{title}] === #{message}"
    end
  end
end
