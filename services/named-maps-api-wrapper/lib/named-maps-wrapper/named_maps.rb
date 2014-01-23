# encoding: utf-8

require 'typhoeus'
require 'json'
require_relative './exceptions'
require_relative './named_map'

module CartoDB
  module NamedMapsWrapper

		class NamedMaps

			def initialize(url = "", api_key = "")
				raise NamedMapsDataError if url.nil? or url.length == 0		\
																 or api_key.nil? or api_key.length == 0

				@url = [ url, 'tiles', 'template' ].join('/')
				@api_key = api_key
				@headers = { 'content-type' => 'application/json' }
				@host = url

				@verbose_mode = false
			end #initialize

			def create(template_data)

				raise NamedMapsDataError if template_data.nil? or template_data.size == 0
				@template = template_data

				response = Typhoeus.post(@url + '?api_key=' + @api_key, { 
					headers: @headers,
					body: ::JSON.dump(template_data),
					verbose: @verbose_mode
					})
				p response.body if @verbose_mode

				if response.code == 200
					body = ::JSON.parse(response.response_body)
					NamedMap.new(body['template_id'], body, self)
				else
					nil
				end
			end #create

			def all
				response = Typhoeus.get(@url + "?api_key=" + @api_key, { 
					headers: @headers,
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				raise HTTPResponseError, response.code if response.code != 200

				::JSON.parse(response.response_body)
			end #all

			def get(name)
				raise NamedMapsDataError if name.nil? or name.length == 0

				response = Typhoeus.get( [@url, name ].join('/') + "?api_key=" + @api_key, { 
					headers: @headers,
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				if response.code == 200
					NamedMap.new(name, ::JSON.parse(response.response_body), self)
				else
					nil
				end
			end #get

			attr_reader	:url, :api_key, :headers, :host

		end #NamedMaps

	end #NamedMapsWrapper
end #CartoDB