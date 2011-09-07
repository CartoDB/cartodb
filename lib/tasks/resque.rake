namespace :resque do
  
  desc "Quit running workers"
  task :stop_workers => :environment do
    pids = []
    Resque.workers.each do |worker|
      pids.concat(worker.worker_pids)
    end
    if pids.empty?
      puts "No workers to kill"
    else
      syscmd = "kill -s QUIT #{pids.join(' ')}"
      system(syscmd)
    end
  end
  
end