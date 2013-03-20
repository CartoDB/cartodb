# encoding: utf-8
require 'sinatra/base'
require 'json'
require 'minitest/autorun'
require 'rack/test'
require_relative '../../../models/visualization/member'
require_relative '../../../models/visualization/collection'

module CartoDB
  module Visualization
    class API < Sinatra::Base
      get '/api/v1/visualizations' do
        collection  = Visualization::Collection.new.fetch
        response    = { visualizations: collection }.to_json
        [200, response]
      end

      post '/api/v1/visualizations' do
        member      = Member.new(payload).store
        collection  = Visualization::Collection.new.fetch
        collection.add(member)
        collection.store

        response  = member.attributes.to_json
        [201, response]
      end # post /api/visualizations

      get '/api/v1/visualizations/:id' do
        begin
          member    = Member.new(id: params.fetch('id')).fetch
          response  = member.attributes.to_json
          [200, response]
        rescue KeyError => exception
          [404]
        end
      end # get /api/v1/visualizations/:id
      
      put '/api/v1/visualizations/:id' do
        begin
          member            = Member.new(id: params.fetch('id')).fetch
          member.attributes = payload
          member.store
          [200, member.attributes.to_json]
        rescue KeyError
          [404]
        end
      end # put /api/v1/visualizations/:id

      delete '/api/v1/visualizations/:id' do
        collection  = Visualization::Collection.new.fetch
        member      = Member.new(id: params.fetch('id'))
        collection.delete(member)
        member.delete
        collection.store
        [204]
      end # delete '/api/v1/visualizations/:id

      helpers do
        def payload
          JSON.parse(request.body.read.to_s || String.new)
        end #payload
      end 
    end # Visualization
  end # API
end # CartoDB

def app
  CartoDB::Visualization::API.new
end

include CartoDB

describe Visualization::API do
  include Rack::Test::Methods
  
  describe 'GET /api/v1/visualization/:id' do
    it 'returns a visualization' do
      get '/api/v1/visualization/:id'
      last_response.status.must_equal 200
    end
  end
end # Visualization::API

