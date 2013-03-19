# encoding: utf-8
require 'sinatra/base'
require 'minitest/autorun'
require 'rack/test'

module CartoDB
  module Visualization
    class API < Sinatra::Base


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

