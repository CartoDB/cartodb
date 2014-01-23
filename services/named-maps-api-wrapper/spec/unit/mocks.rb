# encoding: utf-8

require 'typhoeus'

module CartoDB
  module NamedMapsWrapperSpecs
  	
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