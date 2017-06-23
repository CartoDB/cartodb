namespace :resque do

  task "setup" => :environment do
    Resque.before_fork do |job|
      #we disconnect the worker so it reconnects on each job
      SequelRails.connection.disconnect 
      Resque::Metrics.before_fork.call(job)
    end
    Resque.after_fork = Resque::Metrics.after_fork
  end

  desc "Quit running workers"
  task :stop_workers => :environment do
    pids = []
    Resque.workers.each do |worker|
      pids << worker.id.split(':')[1]
    end
    if pids.empty?
      puts "No workers to kill"
    else
      syscmd = "kill -s QUIT #{pids.join(' ')}"
      system(syscmd)
    end
  end
  
  desc "Clear pending tasks"
  task :clear => :environment do
    queues = Resque.queues
    queues.each do |queue_name|
      puts "Clearing #{queue_name}..."
      Resque.redis.del "queue:#{queue_name}"
    end
    
    puts "Clearing delayed..." # in case of scheduler - doesn't break if no scheduler module is installed
    Resque.redis.keys("delayed:*").each do |key|
      Resque.redis.del "#{key}"
    end
    Resque.redis.del "delayed_queue_schedule"
    
    puts "Clearing stats..."
    Resque.redis.set "stat:failed", 0 
    Resque.redis.set "stat:processed", 0
  end
end
