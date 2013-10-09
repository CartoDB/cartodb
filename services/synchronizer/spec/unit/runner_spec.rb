# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/synchronizer/runner'

include CartoDB::Synchronizer

describe Runner do
  describe '#run' do
    it 'fetches jobs to be run' do
      job_collection  = Minitest::Mock.new
      runner_options  = { tick_time_in_secs: 0.1, max_ticks: 1 }
      runner          = Runner.new(job_collection, runner_options)

      job_collection.expect(:fetch, job_collection)
      job_collection.expect(:process, job_collection)
      runner.run
      job_collection.verify
    end

    it 'accepts a maximum number of ticks as an option' do
      job_collection  = fake_job_collection
      runner_options  = { tick_time_in_secs: 0.1, max_ticks: 2 }
      runner          = Runner.new(job_collection, runner_options)

      runner.run
      runner.ticks.must_equal runner_options.fetch(:max_ticks)
    end

    it 'accepts a tick time as an option' do
      job_collection  = fake_job_collection
      runner_options  = { tick_time_in_secs: 0.3, max_ticks: 3 }
      runner          = Runner.new(job_collection, runner_options)
      before          = Time.now.to_i

      runner.run

      after           = Time.now.to_i
      running_time    = after - before

      (running_time < 2).must_equal true
    end

  end #run

  def fake_job_collection
    collection = Object.new
    def collection.fetch; self; end
    def collection.process; self; end
    collection
  end
end # Runner

