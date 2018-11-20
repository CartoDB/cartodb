require 'carto/configuration'

module CartoDB
  module ResqueMetrics
    def self.logger
      @logger ||= CartoDB.unformatted_logger(Carto::Conf.new.log_file_path('resque_metrics.log'))
    end
  end
end

Resque::Metrics.on_job_complete do |job_class, queue, time|
  CartoDB::ResqueMetrics.logger.info(
    {:event => :job_complete,
     :timestamp => Time.now.utc.iso8601,
     :job_class => job_class.to_s,
     :queue => queue,
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_enqueue do |job_class, queue, time|
  CartoDB::ResqueMetrics.logger.info(
    {:event => :job_enqueue,
     :timestamp => Time.now.utc.iso8601,
     :job_class => job_class.to_s,
     :queue => queue,
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_fork do |job_class, queue|
  CartoDB::ResqueMetrics.logger.info(
    {:event => :job_fork,
     :timestamp => Time.now.utc.iso8601,
     :job_class => job_class.to_s,
     :queue => queue}.to_json
  )
end

Resque::Metrics.on_job_failure do |job_class, queue, time|
  CartoDB::ResqueMetrics.logger.info(
    {:event => :job_failure,
     :timestamp => Time.now.utc.iso8601,
     :job_class => job_class.to_s,
     :queue => queue,
     :time => time}.to_json
  )
end

