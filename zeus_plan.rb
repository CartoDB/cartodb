require 'zeus/rails'

require_relative 'spec/support/redis'
require_relative 'spec/helpers/spec_helper_helpers'

class CustomPlan < Zeus::Rails
  include SpecHelperHelpers

  def carto_test
    # Load everything (disabled in Zeus by default)
    Rails.application.eager_load!

    # Disable before suite hooks
    ENV['PARALLEL'] = 'true'

    # Clean up at least sometimes
    drop_leaked_test_user_databases rescue nil

    # Start redis server
    CartoDB::RedisTest.up

    if ENV['TURBO']
      clean_redis_databases
      clean_metadata_database

      # TODO: This cleanup is necessary due to a bug in TableRelator.table_visualization
      RSpec.configure do |config|
        config.before(:all) do
          Carto::Visualization.where(map_id: nil).each do |v|
            es = v.external_source
            if es
              es.external_data_imports.each(&:delete)
              es.delete
            end
            v.delete
          end
        end
      end
    else
      RSpec.configure do |config|
        config.before(:all) do
          # Clean redis
          clean_redis_databases
          clean_metadata_database
        end
      end
    end
  end

  def test
    if ENV['TURBO']
      job_index = ARGV.find { |i| i.starts_with?('-J#') }
      job_id = ARGV.delete(job_index).split('#')[1] if job_index
      ENV['PARALLEL_SEQ'] = job_id || Process.pid.to_s
    end
    SequelRails.connection.disconnect

    exit super
  end

  def carto_user_dbconsole
    u = Carto::User.find_by_username(ARGV[0])
    exec "psql -U postgres #{u.database_name}"
  end

  def carto_resque
    ENV['VVERBOSE'] = 'true'
    ENV['QUEUE'] = 'imports,exports,users,user_dbs,geocodings,synchronizations,tracker,user_migrations,gears'
    ARGV.replace(['resque:work'])
    Rake.application.run
  end

  def rake
    SequelRails.connection.disconnect
    super
  end
end

Zeus.plan = CustomPlan.new
