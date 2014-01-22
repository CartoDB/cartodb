# encoding: utf-8

require 'typhoeus'
require 'json'
require_relative './exceptions'
require_relative './map_instance'

module CartoDB
  module NamedMapsWrapper

		class NamedMap

			def initialize(name, template, parent)
				raise NamedMapDataError if name.nil? or name.length == 0
				@name = name

				raise NamedMapDataError if template.nil? or template.size == 0
				@template = template

				raise NamedMapDataError unless parent.respond_to?(:url) and parent.respond_to?(:api_key)
				@parent = parent
			end #initialize

			def delete
				response = Typhoeus.delete(url + "?api_key=" + @parent.api_key)
				response.code == 200
			end #delete

			def update
				# TODO implement / check what it needs to update
			end #update

			def url
				[ @parent.url, @name ].join('/')
			end # url

			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB