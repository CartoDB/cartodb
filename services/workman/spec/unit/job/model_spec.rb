# encoding: utf-8
require 'minitest/autorun'
require_relative '../../spec_helper'
require_relative '../../factories/job_data'
require_relative '../../../job/model'

include Workman

describe Job::Model do
  describe 'Job::Model.repository' do
    it 'returns the repository instance for persistence operations' do
      Job::Model.repository.must_be_instance_of DataRepository::Repository
    end
  end # Job::Model.repository

  describe 'Job::Model.repository=' do
    it 'sets the repository for job instances' do
      previous_repository   = Job::Model.repository
      Job::Model.repository = Object.new
      Job::Model.new.send(:repository).must_equal Job::Model.repository
      Job::Model.repository = previous_repository
    end
  end # Job::Model.repository=

  describe 'Job::Model.next_id' do
    it 'returns a UUID to be used as id for an instance' do
      UUIDTools::UUID.parse(Job::Model.next_id).valid?.must_equal true

      one_id      = Job::Model.next_id
      another_id  = Job::Model.next_id

      one_id.wont_equal another_id
    end
  end # Job::Model.next_id

  describe 'validations' do
    describe '#id' do
      it 'must be present' do
        job     = Job::Model.new
        job.id  = nil
        job.valid?.must_equal false
        job.errors.fetch(:id).first.rule.class 
        violations_for(job, :id)
          .must_include(Aequitas::Rule::Presence::NotBlank)
      end

      it 'is generated if none passed' do
        job = Job::Model.new
        job.id.wont_be_empty
      end
    end #id

    describe '#state' do
      it 'must be present' do
        job       = Job::Model.new
        job.state = nil
        job.valid?.must_equal false
        violations_for(job, :state)
          .must_include(Aequitas::Rule::Presence::NotBlank)
      end

      it 'is the ENTRY_STATE by default' do
        job = Job::Model.new
        job.state.must_equal Job::Model::ENTRY_STATE
      end

      it 'must be a valid state' do
        job = Job::Model.new(state: 'bogus')
        job.valid?.must_equal false
        violations_for(job, :state).must_include(Aequitas::Rule::Within)
      end
    end #state

    describe '#command' do
      it 'must be present' do
        job = Job::Model.new
        job.valid?.must_equal false
        violations_for(job, :command)
          .must_include(Aequitas::Rule::Presence::NotBlank)
      end
    end #command
  end # validations

  describe '#persist' do
    it 'persists the job to the repository' do
      job = Job::Model.new(command: 'bogus')
      job.persist

      rehydrated_job = Job::Model.new(id: job.id)
      rehydrated_job.fetch

      job.id        .must_equal rehydrated_job.id
      job.command   .must_equal rehydrated_job.command
    end

    it 'raises if invalid' do
      job = Job::Model.new
      lambda { job.persist }.must_raise RuntimeError
    end
  end #persist

  describe '#transition_to' do
    it 'changes the state of the job and persists it' do
      job = Job::Model.new(command: 'bogus')
      job.state.must_equal Job::Model::ENTRY_STATE
      job.persist

      job.fetch
      random_state = Job::Model::STATES.sample
      job.transition_to random_state
      job.persist

      rehydrated_job = Job::Model.new(id: job.id)
      rehydrated_job.fetch
      rehydrated_job.state.must_equal random_state
    end
  end #transition_to

  describe '#execute' do
    it 'executes the command' do
      command = MiniTest::Mock.new
      job     = Job::Model.new(Factory.job_data)

      command.expect :execute, { result: 'ok' }
      job.execute(command)
      command.verify
    end

    it 'persists the job' do
      command = MiniTest::Mock.new
      job     = Job::Model.new(Factory.job_data)

      command.expect :execute, { result: 'ok' }
      job.execute(command)

      rehydrated_job = Job::Model.new(id: job.id)
      rehydrated_job.fetch
      rehydrated_job.result.wont_be_empty
    end
  end #execute

  def violations_for(model, attribute)
    model.errors.fetch(attribute).map { |error| error.rule.class }
  end #violations_for
end # Job::Model

