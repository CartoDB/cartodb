#!/usr/bin/env ruby
require_relative '../lib/cartodb/threads_machine'
require_relative '../lib/cartodb/scripts/server_load'

class ServerLoad < ThreadsMachine

  def execute

    MAX_THREADS.times do
      queue.enq(ServerLoadScript)
    end

    async do |load_script|
      load_script.new
    end

  end

end

ServerLoad.new.execute
