require_relative '../../../spec_helper'

require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'
require 'mocha'
require_relative '../../../../lib/carto/http/client'
require_relative '../../../../lib/carto/http/request'

describe Carto::Http::Client do

  before(:each) do
    http_client_tag = 'test'
    @client = Carto::Http::Client.get(http_client_tag, log_requests: true)
  end


  describe '#request' do
    it 'wraps creation of typhoeus request objects' do
      expected_url = 'www.example.com'
      expected_options = {
        method: :post,
        body: "this is a request body",
        params: { field1: "a field" },
        headers: { Accept: "text/html", 
                  "User-Agent" => Carto::Http::Request::DEFAULT_USER_AGENT 
                }
      }
      Typhoeus::Request.expects(:new).once.with(expected_url, expected_options)
      @client.request(
                     "www.example.com",
                     method: :post,
                     body: "this is a request body",
                     params: { field1: "a field" },
                     headers: { Accept: "text/html", "User-Agent" => Carto::Http::Request::DEFAULT_USER_AGENT}
                     )
    end
  end

  describe 'Request#run' do
    it 'performs a request through its typhoeus request object' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
      Typhoeus.stub('www.example.com').and_return(expected_response)
      request = @client.request(
                               "www.example.com",
                               method: :post,
                               body: "this is a request body",
                               params: { field1: "a field" },
                               headers: { Accept: "text/html", "User-Agent" => Carto::Http::Request::DEFAULT_USER_AGENT}
                               )
      request.run.should eq expected_response
    end
  end

  describe '#get' do
    it 'creates a wrapped GET request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
      Typhoeus.stub("www.example.com").and_return(expected_response)
      @client.get("www.example.com").should eq expected_response
    end
  end

  describe '#post' do
    it 'creates a wrapped POST request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'success': 'true'}")
      Typhoeus.stub("www.example.com/posts").and_return(expected_response)
      @client.post("www.example.com/posts", body: { title: "test post", content: "this is my test"})
        .should eq expected_response
    end
  end

  describe '#head' do
    it 'creates a wrapped HEAD request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200)
      Typhoeus.stub("www.example.com").and_return(expected_response)
      @client.head("www.example.com").should eq expected_response
    end
  end

  describe '#put' do
    it 'creates a wrapped PUT request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'success': 'true'}")
      Typhoeus.stub("www.example.com/posts/1").and_return(expected_response)
      @client.put("www.example.com/posts/1", body: "whoo, a body").should eq expected_response
    end
  end

  describe '#delete' do
    it 'creates a wrapped DELETE request and runs it' do
      expected_response = Typhoeus::Response.new(code: 204)
      Typhoeus.stub("www.example.com/posts/1").and_return(expected_response)
      @client.delete("www.example.com/posts/1").should eq expected_response
    end
  end

end

