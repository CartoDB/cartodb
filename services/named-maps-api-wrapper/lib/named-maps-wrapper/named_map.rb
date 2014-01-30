# encoding: utf-8

module CartoDB
  module NamedMapsWrapper

		class NamedMap
			NAMED_MAPS_VERSION  = '0.0.1'
			NAME_PREFIX = 'tpl_'
			AUTH_TYPE_OPEN = 'open'
			AUTH_TYPE_SIGNED = 'token'

			def initialize(name, template_data, parent)
				raise NamedMapDataError, 'Name empty' if name.nil? or name.length == 0
				@name = name

				raise NamedMapDataError, 'Parent instance of named maps invalid' unless parent.respond_to?(:url) 			\
																	 and parent.respond_to?(:api_key)		\
																	 and parent.respond_to?(:headers)
				@parent = parent

				@template = template_data

				@verbose_mode = false
			end #initialize

			def delete
				response = Typhoeus.delete(url + "?api_key=" + @parent.api_key, {
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				response.code == 204
			end #delete

			def update(template_data)
				template_data = template_data.merge( { version: NAMED_MAPS_VERSION } )
				p template_data if @verbose_mode

				is_valid_template, validation_errors = valid_template?(template_data)
				raise NamedMapDataError, validation_errors if not is_valid_template


				response = Typhoeus.put(url + '?api_key=' + @parent.api_key, {
					headers: @parent.headers,
					body: ::JSON.dump(template_data),
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				if response.code == 200
					@template = template_data
					true
				else
					raise HTTPResponseError, response.code
				end
			end #update

			def url
				[ @parent.url, @name ].join('/')
			end # url

			def self.normalize_name(raw_name)
				(NAME_PREFIX + raw_name).gsub(/[^a-zA-Z0-9\-\_.]/ , '').gsub('-', '_')
			end # self.normalize_name

			def valid_template?(template_data = nil)
				return true, {} if @parent.validator.nil? or not @parent.validator.respond_to?(:validate)
				if (template_data.nil?)
					NamedMap.validate_template(@template, @parent.validator)
				else
					NamedMap.validate_template(template_data, @parent.validator)
				end
			end #valid_template?

			# Public to allow to be used from named maps without a given instance
			def self.validate_template(template_data, validator)
					validator.validate(template_data)
			end #self.validate_template

			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB