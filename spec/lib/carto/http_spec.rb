# encoding: utf-8

require 'rspec'
require 'mocha'
require 'typhoeus'
require_relative '../../../lib/carto/http'

RSpec.configure do |config|
  config.mock_with :mocha
end

describe Carto::Http::Request do
  describe '#initialize' do
    it 'wraps creation of typhoeus request objects' do
      expected_url = 'www.example.com'
      expected_options = {
        method: :post,
        body: "this is a request body",
        params: { field1: "a field" },
        headers: { Accept: "text/html" }
      }
      Typhoeus::Request.expects(:new).once.with(expected_url, expected_options)
      request = Carto::Http::Request.new(
                            "www.example.com",
                            method: :post,
                            body: "this is a request body",
                            params: { field1: "a field" },
                            headers: { Accept: "text/html" }
                            )
    end
  end

  describe '#run' do
    it 'performs a request through its typhoeus request object' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
      Typhoeus.stub('www.example.com').and_return(expected_response)
      request = Carto::Http::Request.new(
                            "www.example.com",
                            method: :post,
                            body: "this is a request body",
                            params: { field1: "a field" },
                            headers: { Accept: "text/html" }
                            )
      request.run.should eq expected_response
    end
  end
end


describe Carto::Http do

  describe '#get' do
    it 'creates a wrapped GET request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
      Typhoeus.stub("www.example.com").and_return(expected_response)
      Carto::Http.get("www.example.com").should eq expected_response
    end
  end

  describe '#post' do
    it 'creates a wrapped POST request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'success': 'true'}")
      Typhoeus.stub("www.example.com/posts").and_return(expected_response)
      Carto::Http.post("www.example.com/posts", body: { title: "test post", content: "this is my test"})
        .should eq expected_response
    end
  end

  describe '#head' do
    it 'creates a wrapped HEAD request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200)
      Typhoeus.stub("www.example.com").and_return(expected_response)
      Carto::Http.head("www.example.com").should eq expected_response
    end
  end

  describe '#put' do
    it 'creates a wrapped PUT request and runs it' do
      expected_response = Typhoeus::Response.new(code: 200, body: "{'success': 'true'}")
      Typhoeus.stub("www.example.com/posts/1").and_return(expected_response)
      Carto::Http.put("www.example.com/posts/1", body: "whoo, a body").should eq expected_response
    end
  end

  describe '#delete' do
    it 'creates a wrapped DELETE request and runs it' do
      expected_response = Typhoeus::Response.new(code: 204)
      Typhoeus.stub("www.example.com/posts/1").and_return(expected_response)
      Carto::Http.delete("www.example.com/posts/1").should eq expected_response
    end
  end

end

