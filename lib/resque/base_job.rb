# encoding: utf-8

require 'sequel'

module Resque
  class BaseJob
    MAX_RETRIES = 3

    @@queue = ''
    @@retries = 0

    def self.perform(options = {})
      raise NotImplementedError("This class shouldn't be directly instantiated")
    end

    def self.run_action(options, queue_name, action)
      @@queue = queue_name
      begin
        action.call(options)
      rescue Sequel::DatabaseDisconnectError => e
        puts "Job got a DatabaseDisconnectError: #{e.message}"

        regexps = [ /server has gone away/, /decryption failed or bad record mac/, /SSL SYSCALL error: EOF detected/ ]
        match_found = regexps.map { |regexp| regexp.match(e.message) }.any? { |matches| matches }

        if (match_found)
          @@retries += 1
          if (@@retries < MAX_RETRIES)
            puts 'Retrying job'
            retry
          else
            raise e
          end  
        else
          raise e
        end
      end
    end #self.perform

  end #BaseJobs
end