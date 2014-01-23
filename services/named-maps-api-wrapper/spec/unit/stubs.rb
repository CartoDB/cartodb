# encoding: utf-8

require 'typhoeus'

module CartoDB
  module NamedMapsWrapperSpecs
  	class Stubs

		  def self.stubbed_response_200(body="", headers={})
		     Typhoeus::Response.new(
		        code:     200,
		        body:     body,
		        headers:  headers
		     )
		  end #stubbed_response_200

		  def self.stubbed_response_404(headers={})
		     Typhoeus::Response.new(
		        code:     404,
		        body:     "",
		        headers:  headers
		     )
		  end #stubbed_response_404

		end #Stubs

  end #NamedMapsWrapperSpecs
end #CartoDB