module Carto
  class Connector
    # Connector parameters: behaves like a Hash, but:
    #
    # * keys are case-insensitive for [], slice, except, merge!, etc.
    # * original key case is retained by slice, merge, each, map
    # * has validation (errors) based on required and optional keys
    #
    class Parameters
      # Parameters can be defined by a Hash or an array of [key, value] pairs
      # If required or optional arrays of parameter names are passed,
      # then #errors, #valid? use them to check valid parameters
      def initialize(params, required: [], optional: [])
        params ||= {}
        params = if params.respond_to?(:parameters)
                   params.parameters
                 else
                   Hash[params]
                 end
        @params = params.symbolize_keys
        @required_parameters = normalized_array(required || [])
        @optional_parameters = normalized_array(optional || [])
        # TODO: validate definition (no dups...)
        @accepted_parameters = @required_parameters + @optional_parameters
      end

      def [](name)
        _k, v = fetch(name)
        v
      end

      def []=(name, value)
        merge! name => value
      end

      def delete(name)
        k, _v = fetch(name)
        @params.delete(k)
      end

      def blank?
        @params.blank?
      end

      def present?
        @params.present?
      end

      def slice(*param_names)
        normalized_names = normalized_array(param_names)
        Parameters.new(@params.select { |name| normalized_key(name).in?(normalized_names) })
      end

      def except(*param_names)
        normalized_names = normalized_array(param_names)
        Parameters.new(@params.reject { |name| normalized_key(name).in?(normalized_names) })
      end

      def merge!(params)
        params.each do |new_name, new_value|
          old_name, _old_value = fetch(new_name)
          @params.delete(old_name) if old_name
          @params[new_name.to_sym] = new_value
        end
        self
      end

      def reverse_merge!(params)
        params.each do |new_name, new_value|
          old_name, _old_value = fetch(new_name)
          unless old_name
            @params[new_name.to_sym] = new_value
          end
        end
        self
      end

      def parameters
        @params
      end

      def each(&blk)
        parameters.map &blk
      end

      def map(&blk)
        # Parameters.new parameters.map(&blk)
        # Parameters.new Hash[parameters.map(&blk)].stringify_keys
        Parameters.new parameters.map { |k, v|
          k, v = blk[k, v]
          [k.to_sym, v] if k
        }.compact
      end

      def has?(name)
        k, _v = fetch(name)
        !!k
      end

      def normalized_parameters
        normalized_hash @params
      end

      def normalized_names
        @params.keys.map { |name| normalized_key(name) }
      end

      def normalize_parameter_names(names)
        names ||= @accepted_parameters
        normalized_array(Array(names))
      end

      def errors(only_for: nil, parameters_term: 'parameters')
        errors = []
        if @accepted_parameters.present?
          invalid_params = normalized_names - @accepted_parameters
          missing_parameters = @required_parameters - normalized_names
          missing_parameters &= normalize_parameter_names(only_for)
          if missing_parameters.present?
            errors << "Missing required #{parameters_term} #{missing_parameters * ','}"
          end
          errors << "Invalid #{parameters_term}: #{invalid_params * ', '}" if invalid_params.present?
        end
        errors
      end

      def valid?
        errors.empty?
      end

      def dup
        Parameters.new(@params, required: @required_parameters, optional: @optional_parameters)
      end

      def merge(params)
        dup.merge!(params)
      end

      def reverse_merge(params)
        dup.reverse_merge!(params)
      end

      private

      def normalized_key(name)
        # we keep the keys as downcase symbols
        name && name.to_s.downcase.to_sym
      end

      def normalized_hash(hash)
        Hash[hash.map { |name, value| [normalized_key(name), value] }]
      end

      def normalized_array(array)
        array.map { |name| normalized_key(name) }
      end

      # returns [actual_name, value]
      def fetch(name)
        @params.find { |internal_name, _value| internal_name.to_s.casecmp(name.to_s).zero? }
      end
    end
  end
end
