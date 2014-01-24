# encoding: utf-8

require 'typhoeus'

module CartoDB
  module NamedMapsWrapperSpecs

  	class Stubs

		  def self.stubbed_response_200(request_url, body="", headers={})
		  	self.stubbed_response(request_url, 200, body, headers)
		  end #stubbed_response_200

		  def self.stubbed_response_404(request_url, headers={})
		  	self.stubbed_response(request_url, 404, "", headers)
		  end #stubbed_response_404

		  def self.stubbed_response_400(request_url, body="", headers={})
		  	self.stubbed_response(request_url, 400, body, headers)
		  end #stubbed_response_400

		  private

		  def self.stubbed_response(request_url, code, body="", headers={})
		  	Typhoeus.stub(request_url)
              	.and_return(
	              		Typhoeus::Response.new(
						        code:     code,
						        body:     body,
						        headers:  headers
						    ))
		  end #stubbed_response

		end #Stubs

		class NamedMapsMock

			def initialize(url = "", api_key = "")
				@url = url
				@api_key = api_key
				@headers = { 'content-type' => 'application/json' }
			end #initialize

			attr_reader	:url, :api_key, :headers

		end #NamedMapsMock

  end #NamedMapsWrapperSpecs
end #CartoDB