# encoding: utf-8
require 'minitest/autorun'
require 'rack/test'
require_relative '../spec_helper'
require_relative '../../api'
require_relative '../factories/job_data'

include Workman

describe API do
  include Rack::Test::Methods
  def app; API.new; end

  describe 'post /jobs' do
    it 'schedules a new job' do
      post '/jobs', Factory.job_data.to_json

      last_response.status.must_equal 201
      representation = JSON.parse(last_response.body)
      representation.fetch('id').wont_be_empty
      representation.fetch('state').must_equal 'queued'
    end
  end # post /jobs

  describe 'get /jobs/:job_id' do
    it 'queries an existing job' do
      job_data = Factory.job_data
      post '/jobs', job_data.to_json

      representation = JSON.parse(last_response.body)

      get "/jobs/#{representation.fetch('id')}"
      last_response.status.must_equal 200

      representation = JSON.parse(last_response.body)
      representation.fetch('command').must_equal job_data.fetch(:command)
      representation.fetch('state').must_equal 'queued'
    end
  end # get /jobs/:job_id

  describe 'delete /jobs/:job_id' do
    it 'aborts the job' do
      job_data = Factory.job_data
      post '/jobs', job_data.to_json

      representation = JSON.parse(last_response.body)
      delete "/jobs/#{representation.fetch('id')}"
      last_response.status.must_equal 200

      representation = JSON.parse(last_response.body)
      representation.fetch('state').must_equal 'aborted'
    end
  end # delete /jobs /:job_id
end # API

