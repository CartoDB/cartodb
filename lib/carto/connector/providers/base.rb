# encoding: utf-8

# Base class for Connector Providers
#
# This is an abstract class; concrete classes derived from this one
# must implement these methods:
#
# * `copy_table(schema_name:, table_name:, limits:)`
# * `list_tables(limits:)`
# * `check_connection`
# * `remote_data_updated?`
# * `table_name`
# * `required_parameters`
# * `optional_parameters`
# * `features_information`
#
module Carto
  class Connector
    class Provider
      def initialize(connector_context, params = {})
        @connector_context = connector_context
        @params = Parameters.new(params, required: required_parameters + [:provider], optional: optional_parameters)
      end

      def errors(only: nil)
        @params.errors(only: only)
      end

      def valid?
        errors.empty?
      end

      def validate!(only: nil)
        errors = self.errors(only: only)
        raise InvalidParametersError.new(message: errors * "\n") if errors.present?
      end

      def copy_table(schema_name:, table_name:, limits:)
        must_be_defined_in_derived_class schema_name: schema_name, table_name: table_name, limits: limits
      end

      def list_tables(limits:)
        must_be_defined_in_derived_class limits: limits
      end

      def check_connection
        must_be_defined_in_derived_class
      end

      def remote_data_updated?
        must_be_defined_in_derived_class
      end

      # Name of the table to be imported
      def table_name
        must_be_defined_in_derived_class
      end

      # Parameters required by this connector provider
      def required_parameters
        must_be_defined_in_derived_class
      end

      # Optional parameters accepted by this connector provider
      def optional_parameters
        must_be_defined_in_derived_class
      end

      # Parameters accepted by this connector provider
      def accepted_parameters
        required_parameters + optional_parameters
      end

      def self.information
        # For convenience we'll use instance methods to provide the information
        # en each class. Otherwise all the information needed by such methods
        # would have to be defined in class methods too.
        test_provider = new(nil, {})
        {
          features: test_provider.features_information,
          parameters: test_provider.parameters_information
        }
      end

      def features_information
        must_be_defined_in_derived_class
      end

      def parameters_information
        # TODO: add templates with parameter descriptions
        info = {}
        required_parameters.each do |name|
          # TODO: description = load template for parameter name of @provider.name
          info[name.to_s] = {
            required: true
          }
        end
        optional_parameters.each do |name|
          # TODO: description = load template for parameter name of @provider.name
          info[name.to_s] = {
            required: false
          }
        end
        info
      end

      private

      def must_be_defined_in_derived_class(*_)
        raise NotImplementedError, "Method #{caller_locations(1, 1)[0].label} must be defined in derived class"
      end

      def log(message, truncate = true)
        @connector_context.log message, truncate
      end

      def execute(sql)
        @connector_context.execute(sql)
      end

      def execute_as_superuser(sql)
        @connector_context.execute_as_superuser(sql)
      end
    end

  end
end
