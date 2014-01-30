# encoding: utf-8

require 'typhoeus'
require 'json'
require_relative './exceptions'
require_relative './named_map'

module CartoDB
  module NamedMapsWrapper

		class NamedMaps

			def initialize(user_config, tiler_config, validator = nil)
				raise NamedMapsDataError if user_config.nil? or user_config.size == 0			\
																 or tiler_config.nil? or tiler_config.size == 0

				@headers = { 'content-type' => 'application/json' }

				@username = user_config[:name]
				@api_key = user_config[:api_key]

				@host = "#{tiler_config[:protocol]}://#{@username}.#{tiler_config[:domain]}:#{tiler_config[:port]}"
				@url = [ @host, 'tiles', 'template' ].join('/')

				@validator = validator

				@verbose_mode = false
			end #initialize

			def create(template_data)
				raise NamedMapsDataError, { 'template_data' => 'not a Hash object' } if template_data.class != Hash

				template_data = template_data.merge( { :version => NamedMap::NAMED_MAPS_VERSION } )
				p template_data if @verbose_mode

				if (not @validator.nil?)
					is_valid_template, validation_errors = NamedMap.validate_template(template_data, @validator)
					raise NamedMapsDataError, validation_errors if not is_valid_template
				end

				response = Typhoeus.post(@url + '?api_key=' + @api_key, {
					headers: @headers,
					body: ::JSON.dump(template_data),
					verbose: @verbose_mode
					})
				p response.body if @verbose_mode

				if response.code == 200
					body = ::JSON.parse(response.response_body)
					NamedMap.new(body['template_id'], template_data, self)
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
				elsif response.code == 404
					# Request ok, template with provided name not found
					nil
				else
					raise HTTPResponseError, response.code
				end
			end #get

			attr_reader	:url, :api_key, :username, :headers, :host, :validator

		end #NamedMaps

	end #NamedMapsWrapper
end #CartoDB