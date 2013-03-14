# encoding: utf-8
require 'sinatra/base'
require 'json'
require_relative '../../../models/overlay/member'
require_relative '../../../models/overlay/collection'

module CartoDB
  module Overlay
    class API < Sinatra::Base
      OVERLAY_COLLECTION_ID = 'overlays'

      get '/api/v1/visualizations/:visualization_id/overlays' do
        begin
          collection  = Overlay::Collection.new(
                         { id: OVERLAY_COLLECTION_ID }
                       ).fetch
          response    = { overlays: collection }.to_json
          [200, response]
        rescue KeyError => exception
          [404]
        end
      end # get /api/v1/visualizations/:visualization_id/overlays

      post '/api/v1/visualizations/:visualization_id/overlays' do
        collection  = Overlay::Collection.new(
                        { id: OVERLAY_COLLECTION_ID }
                      ).fetch
        member      = Overlay::Member.new(payload)
        collection.add(member)
        collection.store
        response    = member.store.attributes.to_json

        [201, response]
      end # post /api/v1/visualizations/:visualization_id/overlays

      get '/api/v1/visualizations/:visualization_id/overlays/:id' do
        begin
          member    = Overlay::Member.new(id: params.fetch('id')).fetch
          response  = member.attributes.to_json

          [200, response]
        rescue KeyError
          [404]
        end 
      end # get /api/v1/visualizations/:visualization_id/overlays/:id

      put '/api/v1/visualizations/:visualization_id/overlays/:id' do
        begin
          member            = Overlay::Member.new(id: params.fetch('id')).fetch
          member.attributes = payload
          member.store
          response  = member.store.attributes.to_json
          [200, response]
        rescue KeyError
          [404]
        end
      end # put /api/v1/visualizations/:visualization_id/overlays/:id

      delete '/api/v1/visualizations/:visualization_id/overlays/:id' do
        collection  = Overlay::Collection.new(
                        { id: OVERLAY_COLLECTION_ID }
                      ).fetch
        member      = Overlay::Member.new(id: params.fetch('id'))
        collection.delete(member)
        member.delete
        collection.store
        [204]
      end # delete /api/v1/visualizations/:visualization_id/overlays/:id

      helpers do
        def payload
          JSON.parse(request.body.read.to_s || String.new)
            .merge('visualization_id' => params.fetch('visualization_id'))
        end #payload
      end 
    end # API
  end # Overlay
end # CartoDB

