require 'carto/configuration'

module CartoDB
  module ResqueMetrics
    def self.logger
      @logger ||= CartoDB.unformatted_logger(Carto::Conf.new.log_file_path('resque_metrics.log'))
    end
  end
end
