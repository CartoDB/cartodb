# encoding: utf-8

# TODO: Use similar structure as /services/minimal-validation/validator.rb

module CartoDB
  module NamedMapsWrapper

  	class TemplateCreationValidator

			def validate(template_data)
				errors = {}

				return false, { 'template_data' => 'not a Hash object' } if template_data.class != Hash

				[ :version, :name, :auth, :placeholders, :layergroup ].each { |target_key|
					found = false
					template_data.keys.each { |template_key|
						found ||= template_key == target_key
					}
					errors[target_key] = 'key missing' if not found
				}

				if (!errors.keys.include? :auth)
					[ :method ].each { |target_key|
						found = false
						template_data[:auth].keys.each { |template_key|
							found ||= template_key == target_key
						}
						errors[target_key] = 'auth subkey missing' if not found
					}
				end

				if (!errors.keys.include? :layergroup)
					[ :version, :layers ].each { |target_key|
						found = false
						template_data[:layergroup].keys.each { |template_key|
							found ||= template_key == target_key
						}
						errors[target_key] = 'layergroup subkey missing' if not found
					}
				end

				return (errors.size == 0), errors	
			end #validate

		end #TemplateCreationValidator

  end #NamedMapsWrapper
end #CartoDB