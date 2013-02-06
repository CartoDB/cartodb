# encoding: utf-8
require 'redis'
require 'resque'
require_relative './job/model'

module Workman
  class Dispatcher
    attr_reader :queue

    def initialize(queue=Resque)
      @queue = queue
    end #initialize

    def schedule(attributes)
      job = Job::Model.new(attributes)
      job.transition_to(:queued)
      queue.enqueue(job.class, job.id)
      job
    end #schedule

    def abort(job_id)
      job = Job::Model.new(id: job_id).fetch
      job.transition_to(:aborted)
      queue.dequeue(job.class, job.id)
      job
    end #abort

    def query(job_id)
      Job::Model.new(id: job_id).fetch
    end #query
  end # Dispatcher
end # Workman

