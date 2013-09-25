# encoding: utf-8

module CartoDB
  module Importer2
    class Result
      ATTRIBUTES = %w{ name schema extension tables success error_code }
      attr_reader *ATTRIBUTES.map(&:to_sym)

      def initialize(attributes)
        ATTRIBUTES.each do |attribute|
          instance_variable_set :"@#{attribute}",
            attributes.fetch(attribute.to_sym, nil)
        end
      end

      def success?
        success == true
      end

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

      def table_name
        tables.first
      end

      def payload
        return(Hash.new)
        payload = {
          name:           name,
          extension:      extension,
          success:        successful?,
          error_code:     error_code,
          file_url:       public_url,
          distinct_id:    user.username,
          username:       user.username,
          account_type:   user.account_type,
          database:       user.database_name,
          email:          user.email,
          log:            log.to_s
        }
        payload.merge!(error_title: get_error_text) unless result.fetch(:success)
        payload
      end
    end # Result
  end # Importer2
end # CartoDB

