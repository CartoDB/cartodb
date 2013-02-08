# encoding: utf-8
require 'minitest/autorun'
require_relative '../../dispatcher'
require_relative '../factories/job_data'

include Workman

describe Dispatcher do
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
      job         = dispatcher.schedule(Factory.job_data)

      rehydrated_job = Job::Model.new(id: job.id)
      rehydrated_job.fetch
      rehydrated_job.state.must_equal 'queued'
    end

    it 'tells the queueing backend to enqueue the job' do
      job_data    = Factory.job_data
      queue       = MiniTest::Mock.new
      dispatcher  = Dispatcher.new(queue)

      queue.expect :enqueue, nil, [Job::Model, job_data.fetch(:id)]
      dispatcher.schedule(job_data)
      queue.verify
    end
  end #schedule

  describe '#abort' do
    it 'tells the job it has been aborted' do
      dispatcher  = Dispatcher.new(fake_queue)
      job         = dispatcher.schedule(Factory.job_data)

      dispatcher.abort(job.id)

      rehydrated_job = Job::Model.new(id: job.id)
      rehydrated_job.fetch
      rehydrated_job.state.must_equal 'aborted'
    end

    it 'tells the queueing backend to abort the job' do
      job         = Dispatcher.new(fake_queue).schedule(Factory.job_data)
      queue       = MiniTest::Mock.new
      dispatcher  = Dispatcher.new(queue)

      queue.expect :dequeue, nil, [Job::Model, job.id]
      dispatcher.abort(job.id)
      queue.verify
    end
  end #abort

  def fake_queue
    Class.new {
      def enqueue(*args); end
      def dequeue(*args); end
    }.new
  end #fake_queue
end # Dispatcher

