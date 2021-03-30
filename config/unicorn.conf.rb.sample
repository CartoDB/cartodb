unicorn_workers = ENV['CARTO_BUILDER_UNICORN_WORKERS'] && !ENV['CARTO_BUILDER_UNICORN_WORKERS'].to_s.strip.empty? ? ENV['CARTO_BUILDER_UNICORN_WORKERS'].to_i : 4
worker_processes unicorn_workers
user "carto", "carto"
app_root = "/cartodb"
working_directory app_root
listen "3000", :tcp_nopush => true
# nuke workers after 180 seconds instead of 60 seconds (the default)
timeout 180
pid "/tmp/server.pid"
stderr_path "/dev/stderr"
stdout_path "/dev/stdout"

preload_app false
GC.respond_to?(:copy_on_write_friendly=) and
  GC.copy_on_write_friendly = true

after_fork do |server, worker|
  # per-process listener ports for debugging/admin/migrations
    addr = "127.0.0.1:#{9293 + worker.nr}"
    server.listen(addr, :tries => -1, :delay => 5, :tcp_nopush => true)
end

before_exec do |server|
  ENV["BUNDLE_GEMFILE"] = "#{app_root}/Gemfile"
end

