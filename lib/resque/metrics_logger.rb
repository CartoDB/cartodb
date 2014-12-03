module CartoDB
  module Resque
    module Metrics
      def self.logger
        @metric_logger ||= ::Logger.new("#{Rails.root}/log/resque_metrics.log")
      end
    end
  end
end

Resque::Metrics.on_job_complete do |job_class, queue, time|
  CartoDB::Resque::Metrics.logger.info(
    {:event => :job_complete,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_enqueue do |job_class, queue, time|
  CartoDB::Resque::Metrics.logger.info(
    {:event => :job_enqueue,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_fork do |job_class, queue|
  CartoDB::Resque::Metrics.logger.info(
    {:event => :job_fork,
     :job_class => job_class, 
     :queue => queue}.to_json
  )
end

Resque::Metrics.on_job_failure do |job_class, queue, time|
  CartoDB::Resque::Metrics.logger.info(
    {:event => :job_failure,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

