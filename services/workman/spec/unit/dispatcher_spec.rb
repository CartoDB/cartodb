# encoding: utf-8
require 'minitest/autorun'
require_relative '../spec_helper'
require_relative '../../dispatcher'
require_relative '../factories/job_data'

include Workman

describe Dispatcher do
  before do
    @job = Job::Model.new(Factory.job_data)
  end

  describe '#initialize' do
    it 'takes an optional queueing backend' do
      queue       = Object.new
      dispatcher  = Dispatcher.new(queue)

      dispatcher.queue.must_equal queue
    end
  end #initialize

  describe '#schedule' do
    it 'tells the job it has been queued' do
      dispatcher  = Dispatcher.new(fake_queue)
      dispatcher.schedule(@job)

      rehydrated_job = Job::Model.new(id: @job.id)
      rehydrated_job.fetch
      rehydrated_job.state.must_equal 'queued'
    end

    it 'tells the queueing backend to enqueue the job' do
      queue       = MiniTest::Mock.new
      dispatcher  = Dispatcher.new(queue)

      queue.expect :enqueue, nil, [Job::Model, @job.id]
      dispatcher.schedule(@job)
      queue.verify
    end

    it 'logs the state change' do
      dispatcher  = Dispatcher.new
      dispatcher.schedule(@job)

      dispatcher.log.tail.to_s.must_match /queued/
    end
  end #schedule

  describe '#abort' do
    it 'tells the job it has been aborted' do
      dispatcher  = Dispatcher.new(fake_queue)
      dispatcher.schedule(@job)

      dispatcher.abort(@job)

      rehydrated_job = Job::Model.new(id: @job.id)
      rehydrated_job.fetch
      rehydrated_job.state.must_equal 'aborted'
    end

    it 'tells the queueing backend to abort the job' do
      Dispatcher.new(fake_queue).schedule(@job)

      queue       = MiniTest::Mock.new
      dispatcher  = Dispatcher.new(queue)

      queue.expect :dequeue, nil, [Job::Model, @job.id]
      dispatcher.abort(@job)
      queue.verify
    end

    it 'logs the state change' do
      dispatcher  = Dispatcher.new
      dispatcher.schedule(@job)

      dispatcher.abort(@job)
      dispatcher.log.tail.to_s.must_match /aborted/
    end
  end #abort

  def fake_queue
    Class.new {
      def enqueue(*args); end
      def dequeue(*args); end
    }.new
  end #fake_queue
end # Dispatcher

