# encoding: utf-8

class NewDashboardForEverybody < Sequel::Migration

  FLAGS = %w(new_public_dashboard new_dashboard new_public_dashboard_global)
  START_SEQ_NUMBER = -1000

  def up
    # Create sequence to avoid trouble generating unique ids
    # It starts in negative numbers and goes downward in order to be able to identify quickly flags added automatically
    Rails::Sequel.connection.run(%Q{
      CREATE SEQUENCE machine_added_feature_flags_id_seq INCREMENT BY -1
        START WITH #{START_SEQ_NUMBER}
        OWNED BY feature_flags.id;
    })

    # Update the flags if they exist to make them unrestricted
    Rails::Sequel.connection.run(%Q{
      UPDATE feature_flags SET restricted = FALSE WHERE name IN (#{sql_flag_list}) AND restricted = TRUE;
    })

    # Create the flags if they don't exist
    Rails::Sequel.connection.run(%Q{
      INSERT INTO feature_flags (id, name, restricted)
        WITH flags_to_add as (
          SELECT * FROM (SELECT unnest(array[#{sql_flag_list}]) as name) as flag EXCEPT (SELECT name from feature_flags)
        )
      SELECT nextval('machine_added_feature_flags_id_seq'), name, FALSE FROM flags_to_add;
    })
  end

  def sql_flag_list
    FLAGS.map {|flag| "'#{flag}'"}.join(',')
  end

  def down
    # Drop sequence
    Rails::Sequel.connection.run(%Q{
      DROP SEQUENCE IF EXISTS machine_added_feature_flags_id_seq;
    })

    # Delete automatically-added flags
    Rails::Sequel.connection.run(%Q{
      DELETE FROM feature_flags WHERE id <= #{START_SEQ_NUMBER};
    })

  end

end
