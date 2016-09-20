# encoding: utf-8

# Base class for Connector Providers
# that use FDW to import data through a foreign table

module Carto
  class Connector
    class Provider
      def initialize(params = {})
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

      # Name of the table to be imported
      def table_name
        must_be_defined_in_derived_class
      end

      # Name of the foreign table that create_foreign_table_command creates
      def foreign_table_name(_foreign_prefix)
        must_be_defined_in_derived_class
      end

      # SQL code to create the FDW server
      def create_server_command(_server_name)
        must_be_defined_in_derived_class
      end

      # SQL code to create the usermap for the user and postgres roles
      def create_usermap_command(_server_name, _username)
        must_be_defined_in_derived_class
      end

      # SQL code to create the foreign table used for importing
      def create_foreign_table_command(_server_name, _schema_name, _foreign_prefix, _username)
        must_be_defined_in_derived_class
      end

      # SQL code to drop the FDW server
      def drop_server_command(server_name)
        fdw_drop_server server_name
      end

      # SQL code to drop the user mapping
      def drop_usermap_command(server_name, user)
        fdw_drop_usermap server_name, user
      end

      # SQL code to drop the foreign table
      def drop_foreign_table_command(schema_name, table_name)
        fdw_drop_foreign_table schema_name, table_name
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
        test_provider = new({})
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

      include FdwSupport

      def must_be_defined_in_derived_class
        raise NotImplementedError, "Method #{caller_locations(1, 1)[0].label} must be defined in derived class"
      end

    end

  end
end
