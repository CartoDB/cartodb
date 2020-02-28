# NOTE: this depends on migration SequenceForAutomatedFeatureFlags
class FeatureFlagsForNewDashboard < Sequel::Migration

  FLAGS = %w(new_public_dashboard new_dashboard new_public_dashboard_global)

  def up
    # Update the flags if they exist to make them unrestricted
    SequelRails.connection.run(%Q{
      UPDATE feature_flags SET restricted = FALSE WHERE name IN (#{sql_flag_list}) AND restricted = TRUE;
    })

    # Create the flags if they don't exist
    SequelRails.connection.run(%Q{
      INSERT INTO feature_flags (id, name, restricted)
        WITH flags_to_add as (
          SELECT * FROM (SELECT unnest(array[#{sql_flag_list}]) as name) as flag EXCEPT (SELECT name from feature_flags)
        )
      SELECT nextval('#{SequenceForAutomatedFeatureFlags::NAME}'), name, FALSE FROM flags_to_add;
    })
  end

  def down
    # Delete automatically-added flags
    SequelRails.connection.run(%Q{
      DELETE FROM feature_flags WHERE id <= #{SequenceForAutomatedFeatureFlags::START_SEQ_NUMBER} AND name IN (#{sql_flag_list});
    })
  end

  def sql_flag_list
    FLAGS.map {|flag| "'#{flag}'"}.join(',')
  end

end
