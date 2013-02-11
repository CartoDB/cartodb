# encoding: utf-8
require 'redis'
require 'resque'
require_relative './job/model'
require_relative '../track_record/track_record'

module Workman
  class Dispatcher
    attr_reader :queue, :log

    MESSAGE_TEMPLATE = "Job {job_id} changed to '{state}'"

    def initialize(queue=Resque, log=TrackRecord::Log.new)
      @queue  = queue
      @log    = log
    end #initialize

    def schedule(attributes)
      job = Job::Model.new(attributes)
      job.transition_to(:queued)
      queue.enqueue(job.class, job.id)
      log.append entry_for(job, :queued)
      job
    end #schedule

    def abort(job_id)
      job = Job::Model.new(id: job_id).fetch
      job.transition_to(:aborted)
      queue.dequeue(job.class, job.id)
      log.append entry_for(job, :aborted)
      job
    end #abort

    def query(job_id)
      Job::Model.new(id: job_id).fetch
    end #query
    private

    def entry_for(job, state)
      { job_id: job.id, message: message_for(job.id, state) }
    end

    def message_for(job_id, state)
      MESSAGE_TEMPLATE.dup
        .gsub(/{job_id}/, job_id)
        .gsub(/{state}/, state.to_s)
    end #message_for
  end # Dispatcher
end # Workman

