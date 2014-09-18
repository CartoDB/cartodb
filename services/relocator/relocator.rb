require 'pg'
require 'erb'
require 'redis'

require_relative 'relocator/dumper'
require_relative 'relocator/queue_consumer'
require_relative 'relocator/dumper'
require_relative 'relocator/tester'
require_relative 'relocator/organization_tester'
require_relative 'relocator/table_dumper'
require_relative 'relocator/schema_dumper'
require_relative 'relocator/trigger_loader'
module CartoDB
  module Relocator
    class Relocation
      include CartoDB::Relocator::Connections

      def initialize(config = {})
        @dbname = ARGV[0] || ""
        default_config = {
          :mode => :relocate, # relocate, organize
          :dbname => @dbname,
          :username => @dbname.gsub(/_db$/, ""),
          :redis => {:host => '127.0.0.1', :port => 6379, :db => 10},
          :source => {
            :conn => {:dbname => @dbname, :host => '127.0.0.1', :port => '5432'}, :schema => 'public',
          },
          :target => {
            :conn => {:dbname => @dbname, :host => '127.0.0.1', :port => '5432'}, :schema => 'public',
          },
          :create => true, :add_roles => true, :user_object => nil}

        @config = Utils.deep_merge(default_config, config)

        #@source_db = PG.connect(@config[:source][:conn])
        #@target_db = PG.connect(@config[:target][:conn])

        @trigger_loader = TriggerLoader.new(config: @config)
        if config[:mode] == :relocate
          @dumper = Dumper.new(config: @config)
        else
          @dumper = SchemaDumper.new(config: @config)
        end
        @consumer = QueueConsumer.new(config: @config)
        @tester   = Tester.new(config: @config)
        if config[:mode] == :organize
          @org_tester = OrganizationTester.new(config: @config)
        end 
      end

      def migrate
        if @config[:mode] == :relocate
        @trigger_loader.load_triggers
        @dumper.migrate
        @trigger_loader.unload_triggers(target_db)
        @consumer.redis_migrator_loop
        end

        if @config[:mode] == :organize
          @dumper.migrate
        end
      end

      def finalize
        if @config[:mode] == :relocate
          @consumer.redis_migrator_loop
          @trigger_loader.unload_triggers
        end
      end
      def compare
        @tester.compare_state
      end

      def setup
        @dumper.setup
      end

      def cleanup
        @dumper.cleanup
      end

      def check_org_user(user)
        @org_tester.check_user_permissions(user)
      end

      def rollback
        if @config[:mode] == :relocate
          @trigger_loader.unload_triggers
          @consumer.empty_queue
        end

        if @config[:mode] == :organize
          @dumper.remove_target_schema
        end
      end
    end
  end
end

