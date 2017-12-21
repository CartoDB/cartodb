# This file is used by Rack-based servers to start the application.

# ---------------------
# Unicorn unicorn-worker-killer gem config (must be before the environment require)
# @see https://github.com/kzk/unicorn-worker-killer

#require 'unicorn/worker_killer'

# Max requests per worker. Uncomment last parameter for verbosity (at unicorn log)

#use Unicorn::WorkerKiller::MaxRequests, 3072, 4096 #, true

# Max memory size (RSS) per worker. Uncomment last parameter for verbosity (at unicorn log)

#use Unicorn::WorkerKiller::Oom, (500*(1024**2)), (600*(1024**2)) #, true

# ---------------------

require ::File.expand_path('../config/environment',  __FILE__)
run CartoDB::Application
