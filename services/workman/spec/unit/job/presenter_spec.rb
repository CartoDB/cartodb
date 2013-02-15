# encoding: utf-8
require 'minitest/autorun'
require_relative '../../spec_helper'
require_relative '../../../job/presenter'
require_relative '../../factories/job_data'

include Workman

describe Job::Presenter do
  describe '#initialize' do
    it 'takes a job instance' do
      lambda { Job::Presenter.new }.must_raise ArgumentError
      Job::Presenter.new(Object.new).must_be_instance_of Job::Presenter
    end
  end #initialize

  describe '#as_json' do
    it 'renders a JSON representation of the job' do
      presenter       = Job::Presenter.new(
                          Factory.job_data.merge(state: 'queued')
                        )
      representation  = JSON.parse(presenter.as_json)

      representation.fetch('id')        .wont_be_nil
      representation.fetch('command')   .wont_be_nil
      representation.fetch('state')     .wont_be_nil
    end
  end #as_json
end # Job::Presenter

