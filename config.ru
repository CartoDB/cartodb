# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment',  __FILE__)
run CartoDB::Application

# For specifics about Unicorn worker killer config to set here, check https://github.com/kzk/unicorn-worker-killer
