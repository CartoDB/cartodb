# encoding: utf-8

require 'typhoeus'
require 'json'
require_relative './exceptions'
require_relative './map_instance'

module CartoDB
  module NamedMapsWrapper

		class NamedMap

			def initialize(name, template_data, parent)
				raise NamedMapDataError if name.nil? or name.length == 0
				@name = name

				raise NamedMapDataError if template_data.nil? or template_data.size == 0
				@template = template_data

				raise NamedMapDataError unless parent.respond_to?(:url) and parent.respond_to?(:api_key)
				@parent = parent

				@verbose_mode = false
			end #initialize

			def delete
				response = Typhoeus.delete(url + "?api_key=" + @parent.api_key, {
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				response.code == 200
			end #delete

			def update(template_data)
				raise NamedMapDataError if template_data.nil? or template_data.size == 0

				response = Typhoeus.put(url + '?api_key=' + @parent.api_key, { 
					headers: @parent.headers,
					body: ::JSON.dump(template_data),
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				if response.code == 200
					@template = template_data
				else
					raise HTTPResponseError, response.code
				end
			end #update

			def url
				[ @parent.url, @name ].join('/')
			end # url

			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB