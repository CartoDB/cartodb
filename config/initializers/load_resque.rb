require 'resque'
require 'resque/failure/base'
require 'resque/failure/multiple'
require 'resque/failure/redis'

# Load automatically all resque files from lib/resque
Dir[Rails.root.join("lib/resque/*.rb")].each {|f| require f}

Resque.redis = "#{Cartodb.config[:redis]['host']}:#{Cartodb.config[:redis]['port']}"
Resque.metric_logger = Logger.new("#{Rails.root}/log/resque_metrics.log")

Resque::Metrics.on_job_complete do |job_class, queue, time|
  Resque.metric_logger.info(
    {:event => :job_complete,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_enqueue do |job_class, queue, time|
  Resque.metric_logger.info(
    {:event => :job_enqueue,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_fork do |job_class, queue|
  Resque.metric_logger.info(
    {:event => :job_fork,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

Resque::Metrics.on_job_failure do |job_class, queue|
  Resque.metric_logger.info(
    {:event => :job_failure,
     :job_class => job_class, 
     :queue => queue, 
     :time => time}.to_json
  )
end

