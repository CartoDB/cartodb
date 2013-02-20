# encoding: utf-8
require 'redis'
require 'resque'
require_relative './job/model'
require_relative '../track_record/track_record'

module Workman
  class Dispatcher
    attr_reader :queue, :log

    MESSAGE_TEMPLATE = "Job {job_id} changed to '{state}'"

    def self.perform(job_id)
      new.execute(job_id)
    end #self.perform

    def initialize(queue=Resque, log=TrackRecord::Log.new)
      @queue  = queue
      @log    = log
    end #initialize

    def schedule(job)
      job.transition_to(:queued)
      queue.enqueue(job.class, job.id)
      log.append entry_for(job, :queued)
      job
    end #schedule

    def abort(job)
      job.transition_to(:aborted)
      queue.dequeue(job.class, job.id)
      log.append entry_for(job, :aborted)
      job
    end #abort

    def query(job)
      job
    end #query

    def execute(job)
      transition_and_log(job, :running)
      job.execute
      transition_and_log(job, :success)
    rescue => exception
      transition_and_log(job, :failure)
      raise exception
    end #execute

    private

    def entry_for(job, state)
      { job_id: job.id, message: message_for(job.id, state) }
    end #entry_for

    def message_for(job_id, state)
      MESSAGE_TEMPLATE.dup
        .gsub(/{job_id}/, job_id)
        .gsub(/{state}/, state.to_s)
    end #message_for

    def transition_and_log(job, state)
      log.append entry_for(job, state)
      job.transition_to(state)
    end #transition_and_log
  end # Dispatcher
end # Workman

