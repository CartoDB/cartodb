namespace :cartodb do
  namespace :acceptance do

    DEFAULT_SLEEP_TIME = 10

    desc 'Acceptance tests regarding Ghost Tables trigger'
    task :ghost_tables, [:username, :sleep_time] => :environment do |_t, args|
      raise 'usage: rake cartodb:acceptance:ghost_tables[username]' if args[:username].blank?
      @user = Carto::User.find_by(username: args[:username])
      raise "user with username '#{args[:username]}' not found" unless @user
      args.with_defaults(sleep_time: DEFAULT_SLEEP_TIME)
      @sleep_time = args[:sleep_time].to_i
      @results = []

      9.times.each do |index|
        reset_user
        @results << send("test#{index + 1}")
      end

      reset_user

      puts "\n=======================================\n\n"
      @results.each { |result| p result }
      puts "\n=======================================\n\n"
    end

    # helpers

    def reset_user
      @user.db_service.drop_ghost_tables_event_trigger
      disable_feature_flag
      Carto::Visualization.where(user_id: @user.id, name: 'casper').all.each(&:destroy)
      @user.tables.where(name: 'casper').all.each(&:destroy)
      @user.in_database.run('DROP TABLE IF EXISTS casper;')
      @user.db_service.create_ghost_tables_event_trigger
    end

    def run_and_wait(query)
      @user.in_database.run(query)
      p "Waiting #{@sleep_time} seconds..."
      sleep @sleep_time
    end

    def create_table_and_cartodbfy
      run_and_wait(%{
        CREATE TABLE casper ();
        SELECT * FROM CDB_CartodbfyTable('casper');
      })
    end

    def create_map
      source = Carto::Visualization.where(user_id: @user.id, name: 'casper').first
      map = CartoDB::Visualization::TableBlender.new(Carto::User.find(@user.id), [source.user_table]).blend
      Carto::Visualization.create!(
        name: 'casper',
        type: Carto::Visualization::TYPE_DERIVED,
        user_id: @user.id,
        map_id: map.id,
        privacy: Carto::Visualization::PRIVACY_PUBLIC
      )
    end

    def enable_feature_flag
      ff = Carto::FeatureFlag.find_by(name: 'ghost_tables_trigger_disabled')
      @user.activate_feature_flag!(ff)
      @user.reload
    end

    def disable_feature_flag
      ff = Carto::FeatureFlag.find_by(name: 'ghost_tables_trigger_disabled')
      Carto::FeatureFlagsUser.where(feature_flag: ff, user: @user).destroy_all
      @user.reload
    end

    def build_result(description, condition)
      result = condition ? "OK!" : "Fail!"
      "#{description}... #{result}"
    end

    def table_linked?
      @user.tables.where(name: 'casper').count == 1
    end

    # tests

    def test1
      description = "Create table"
      run_and_wait("CREATE TABLE casper ();")
      p build_result(description, !table_linked?)
    end

    def test2
      description = "Create table and cartodbfy"
      create_table_and_cartodbfy
      p build_result(description, table_linked?)
    end

    def test3
      description = "Select into and cartodbfy"
      run_and_wait(%{
        SELECT INTO casper FROM (SELECT 1) AS tmp;
        SELECT * FROM CDB_CartodbfyTable('casper');
      })
      p build_result(description, table_linked?)
    end

    def test4
      description = "Drop table"
      create_table_and_cartodbfy
      assert1 = table_linked?

      run_and_wait("DROP TABLE casper;")
      assert2 = !table_linked?

      p build_result(description, assert1 && assert2)
    end

    def test5
      description = "Create table and cartodbfy without trigger"
      @user.db_service.drop_ghost_tables_event_trigger
      create_table_and_cartodbfy
      p build_result(description, !table_linked?)
    end

    def test6
      description = "Drop and create inside a transaction"
      create_table_and_cartodbfy
      create_map
      assert1 = Carto::Visualization.where(user_id: @user.id, type: Carto::Visualization::TYPE_DERIVED).all.count == 1

      run_and_wait(%{
        DROP TABLE casper;
        CREATE TABLE casper ();
        SELECT * FROM CDB_CartodbfyTable('casper');
      })
      assert2 = Carto::Visualization.where(user_id: @user.id, type: Carto::Visualization::TYPE_DERIVED).all.count == 1

      p build_result(description, assert1 && assert2)
    end

    def test7
      description = "Drop and create without transaction"
      create_table_and_cartodbfy
      create_map
      assert1 = Carto::Visualization.where(user_id: @user.id, type: Carto::Visualization::TYPE_DERIVED).all.count == 1

      run_and_wait("DROP TABLE casper;")
      create_table_and_cartodbfy
      assert2 = Carto::Visualization.where(user_id: @user.id, type: Carto::Visualization::TYPE_DERIVED).all.empty?

      p build_result(description, assert1 && assert2)
    end

    def test8
      description = "With ghost_tables_trigger_disabled FF"
      @user.db_service.drop_ghost_tables_event_trigger
      enable_feature_flag
      @user.db_service.create_ghost_tables_event_trigger

      create_table_and_cartodbfy

      p build_result(description, !table_linked?)
    end

    def test9
      description = "Without TIS configuration"
      @user.in_database(as: :superuser).run("SELECT cartodb.CDB_Conf_RemoveConf('invalidation_service')")

      create_table_and_cartodbfy

      p build_result(description, !table_linked?)
    end
  end
end
