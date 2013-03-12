# encoding: utf-8
require 'sinatra/base'
require 'json'
require_relative '../../../models/visualization/member'

module CartoDB
  module Visualization
    class API < Sinatra::Base
      get '/api/v1/visualizations/:id' do
        begin
          member    = Member.new(id: params.fetch('id')).fetch
          response  = member.attributes.to_json
          [200, response]
        rescue KeyError
          [404]
        end
      end # get /api/v1/visualizations/:id
      
      post '/api/v1/visualizations' do
        member    = Member.new(payload).store
        response  = member.attributes.to_json
        [201, response]
      end # post /api/visualizations

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
        Member.new(id: params.fetch('id')).delete
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

