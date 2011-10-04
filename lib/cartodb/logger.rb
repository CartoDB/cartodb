module CartoDB
  class Logger
    def self.info title = "CartoDB Log", message
      Rails.logger.info "#{'=' * 10} #{title} #{'=' * 10}"
      Rails.logger.info message
      Rails.logger.info '=' * (22 + title.size)
    end
  end  
end    