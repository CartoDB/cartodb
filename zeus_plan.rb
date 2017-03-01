require 'zeus/rails'

require_relative 'spec/support/redis'
require_relative 'spec/helpers/spec_helper_helpers'

class CustomPlan < Zeus::Rails
  include SpecHelperHelpers

  def carto_test
    # Disable before suite hooks
    ENV['PARALLEL'] = 'true'

    # Clean up at least sometimes
    drop_leaked_test_user_databases rescue nil

    # Start redis server
    CartoDB::RedisTest.up

    if ENV['TURBO']
      clean_redis_databases
      clean_metadata_database
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
    Rails::Sequel.connection.disconnect

    exit super
  end

  def carto_user_dbconsole
    u = Carto::User.find_by_username(ARGV[0])
    exec "psql -U postgres #{u.database_name}"
  end

  def carto_resque
    ENV['VVERBOSE'] = 'true'
    ENV['QUEUE'] = 'imports,exports,users,user_dbs,geocodings,synchronizations,tracker,user_migrations'
    ARGV.replace(['resque:work'])
    Rake.application.run
  end
end

Zeus.plan = CustomPlan.new
