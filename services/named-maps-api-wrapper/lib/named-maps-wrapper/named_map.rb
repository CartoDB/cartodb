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

			# Delete existing named map
			def delete
				response = Typhoeus.delete(url + "?api_key=" + @parent.api_key, {
					verbose: @verbose_mode
				})
				p response.body if @verbose_mode

				response.code == 204
			end #delete

			# Update a named map's template data (full replace update)
			def update(visualization)

				template_data = @parent.get_template_data( visualization )
				p template_data if @verbose_mode

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

			# Url to access a named map's tiles
			def url
				[ @parent.url, @name ].join('/')
			end # url

			# Normalize a name to make it "named map valid"
			def self.normalize_name(raw_name)
				(NAME_PREFIX + raw_name).gsub(/[^a-zA-Z0-9\-\_.]/ , '').gsub('-', '_')
			end # self.normalize_name

			attr_reader	:template

		end #NamedMap

  end #NamedMapsWrapper
end #CartoDB