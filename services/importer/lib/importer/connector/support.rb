module CartoDB
  module Importer2
    class Connector
      module Support
        module_function

        def fetch_ignoring_case(hash, key)
          if hash
            _k, v = hash.find { |k, _v| k.to_s.casecmp(key.to_s) == 0 }
            v
          end
        end
      end

      private

      include Support
    end
  end
end
