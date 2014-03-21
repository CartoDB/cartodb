module CartoDB
  module Relocator
    class Utils
      def self.conn_string(config)
        %Q{#{!config[:user] ? "" : "-U "+config[:user] } -h #{config[:host]} -p #{config[:port]} -d #{config[:dbname]} }
      end
  
      def self.deep_merge(first, second)
        merger = proc { |key, v1, v2| Hash === v1 && Hash === v2 ? v1.merge(v2, &merger) : v2 }
        first.merge(second, &merger)
      end
    end
    module Connections
      def target_db
        @target_db ||= PG.connect(@config[:target][:conn])
      end
      def source_db
        @source_db ||= PG.connect(@config[:source][:conn])
      end

    end
  end
end

