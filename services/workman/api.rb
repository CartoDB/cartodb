# encoding: utf-8
require 'sinatra/base'
require 'json'
require_relative './job/presenter'
require_relative './dispatcher'

module Workman
  class API < Sinatra::Base
    post '/jobs' do
      job = Dispatcher.new.schedule(payload)
      [201, present(job)]
    end # post /jobs

    get '/jobs/:job_id' do
      job = Dispatcher.new.query(params.fetch('job_id'))
      [200, present(job)]
    end # get /jobs

    delete '/jobs/:job_id' do
      job = Dispatcher.new.abort(params.fetch('job_id'))
      [200, present(job)]
    end # delete /jobs

    private

    def present(job)
      Job::Presenter.new(job).as_json
    end #present

    def payload
      @payload ||= JSON.parse(raw_payload).delete_if { |k, v| k =~ /^id/ }
    end #payload

    def raw_payload
      request.body.read.to_s || String.new
    end #raw_payload
  end # API
end # Workman

