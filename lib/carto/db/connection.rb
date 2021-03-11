module Carto
  module Db
    class InvalidConfiguration < RuntimeError; end

    class Connection

      SCHEMA_PUBLIC = 'public'.freeze
      SCHEMA_CARTODB = 'cartodb'.freeze
      SCHEMA_IMPORTER = 'cdb_importer'.freeze
      SCHEMA_GEOCODING = 'cdb'.freeze
      SCHEMA_CDB_DATASERVICES_API = 'cdb_dataservices_client'.freeze
      SCHEMA_AGGREGATION_TABLES = 'aggregation'.freeze

      class << self
        include ::LoggerHelper

        def connect(db_host, db_name, options = {})
          validate_options(options)
          if options[:statement_timeout]
            filtered_options = options.reject { |k, _| k == :statement_timeout }
            _, conn = connect(db_host, db_name, filtered_options)
            conn.execute(%{ SET statement_timeout TO #{options[:statement_timeout]} })
          end

          configuration = get_db_configuration_for(db_host, db_name, options)

          conn = $pool.fetch(configuration) do
            get_database(options, configuration)
          end

          database = Carto::Db::Database.new(db_host, conn)

          if block_given?
            yield(database, conn)
          else
            return database, conn
          end
        ensure
          if options[:statement_timeout]
            filtered_options = options.reject { |k, _| k == :statement_timeout }
            _, conn = connect(db_host, db_name, filtered_options)
            conn.execute(%{ SET statement_timeout TO DEFAULT })
          end
        end

        private

        def get_database(options, configuration)
          resolver = ActiveRecord::ConnectionAdapters::ConnectionSpecification::Resolver.new([])
          conn = ActiveRecord::Base.connection_handler.establish_connection(
            get_connection_name(options[:as]), resolver.spec(configuration)
          ).connection

          # TODO: Maybe we should avoid doing this kind of operations here or remove it because
          #       all internal calls to functions should use the schema name like if we were using
          #       namespaces to avoid collisions and problems
          if options[:as] != :cluster_admin
            conn.execute(%{ SET search_path TO #{build_search_path(options[:user_schema])} })
          end
          conn
        end

        def build_search_path(user_schema, quote_user_schema = true)
          quote_char = quote_user_schema ? "\"" : ""
          "#{quote_char}#{user_schema}#{quote_char}, #{SCHEMA_CARTODB}, #{SCHEMA_CDB_DATASERVICES_API}, #{SCHEMA_PUBLIC}"
        end

        class NamedThing
          def initialize(name)
            @name = name
          end
          attr_reader :name
        end

        def get_connection_name(kind = :carto_db_connection)
          NamedThing.new(kind.to_s)
        end

        def get_db_configuration_for(db_host, db_name, options)
          logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)

          # TODO: proper AR config when migration is complete
          base_config = ::SequelRails.configuration.environment_for(Rails.env)
          config = {
            orm:      'ar',
            adapter:  "postgresql",
            logger:   logger,
            host:     db_host,
            username: base_config['username'],
            password: base_config['password'],
            database: db_name,
            port:     base_config['port'],
            encoding: base_config['encoding'].nil? ? 'unicode' : base_config['encoding'],
            connect_timeout: base_config['connect_timeout']
          }

          case options[:as]
          when :superuser
            config
          when :cluster_admin
            config.merge(
              database: 'postgres'
            )
          when :public_user
            config.merge(
              username: CartoDB::PUBLIC_DB_USER,
              password: CartoDB::PUBLIC_DB_USER_PASSWORD
            )
          when :public_db_user
            config.merge(
              username: options[:username],
              password: CartoDB::PUBLIC_DB_USER_PASSWORD
            )
          else
            config.merge(
              username: options[:username],
              password: options[:password]
            )
          end
        end

        def validate_options(options)
          if !options[:user_schema] && options[:as] != :cluster_admin
            log_error(
              message: 'Connection needs user schema if the user is not the cluster admin',
              target_user: options[:username],
              params: { user_type: options[:as], schema: options[:user_schema] }
            )
            raise Carto::Db::InvalidConfiguration.new('Connection needs user schema if user is not the cluster admin')
          end

          ## If we don't pass user type we are using a regular user and username/password is mandatory
          if !options[:as] && (!options[:username] || !options[:password])
            log_error(
              message: 'Db connection needs username/password for regular user',
              target_user: options[:username],
              params: { user_type: options[:as] }
            )
            raise Carto::Db::InvalidConfiguration.new('Db connection needs user username/password for regular user')
          end
        end

      end
    end
  end
end
