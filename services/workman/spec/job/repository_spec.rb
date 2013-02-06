# encoding: utf-8
require 'minitest/autorun'
require_relative '../../job/repository'

include Workman

describe Job::Repository do
  describe '#store' do
    it 'stores some data related to a unique id' do
      repository  = Job::Repository.new
      id          = rand(5)
      repository.store(id, { state: 'bogus' })

      repository.fetch(id).fetch(:state).must_equal 'bogus'
    end
  end #store
end # Job::Repository

