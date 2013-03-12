# encoding: utf-8
require 'sinatra/base'
require 'json'
require_relative '../../../models/overlay/member'

module CartoDB
  module Overlay
    class API < Sinatra::Base
      post '/api/v1/visualizations/:visualization_id/overlays' do
        member          = Overlay::Member.new(payload)
        response        = member.store.attributes.to_json

        [201, response]
      end # POST /api/v1/visualizations/:visualization_id/overlays

      get '/api/v1/visualizations/:visualization_id/overlays/:id' do
        begin
          member    = Overlay::Member.new(id: params.fetch('id')).fetch
          response  = member.attributes.to_json

          [200, response]
        rescue KeyError
          [404]
        end 
      end # GET /api/v1/visualizations/:visualization_id/overlays/:id

      put '/api/v1/visualizations/:visualization_id/overlays/:id' do
        member            = Overlay::Member.new(id: params.fetch('id')).fetch
        member.attributes = payload

        response  = member.store.attributes.to_json
        [200, response]
      end # PUT /api/v1/visualizations/:visualization_id/overlays/:id

      delete '/api/v1/visualizations/:visualization_id/overlays/:id' do
        member = Overlay::Member.new(id: params.fetch('id')).delete
        [204]
      end # DELETE /api/v1/visualizations/:visualization_id/overlays/:id

      helpers do
        def payload
          JSON.parse(request.body.read.to_s || String.new)
            .merge('visualization_id' => params.fetch('visualization_id'))
        end #payload
      end 
    end # API
  end # Overlay
end # CartoDB

