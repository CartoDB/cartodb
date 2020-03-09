require_relative '../url/instagram_oauth'
require_relative './base_decorator'
require_relative './instagram_decorator'
require_relative './mailchimp_decorator'


module CartoDB
  module Datasources
    module Decorators
      class Factory

        def self.decorator_for(data_import_service_name='')
          case data_import_service_name
            when Url::InstagramOAuth::DATASOURCE_NAME
              Decorators::InstagramDecorator.new
            when Url::MailChimp::DATASOURCE_NAME
              Decorators::MailchimpDecorator.new
            else
              nil
          end
        end

      end
    end
  end
end

