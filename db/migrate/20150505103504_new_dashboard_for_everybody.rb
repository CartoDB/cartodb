# encoding: utf-8

class NewDashboardForEverybody < Sequel::Migration

  FLAGS = %w(new_public_dashboard new_dashboard new_public_dashboard_global)

  def up
    FLAGS.each do |flag_name|
      feature_flag = FeatureFlag[name: flag_name]
      if feature_flag
        if feature_flag.restricted
          feature_flag.restricted = false
          feature_flag.save
        end
      else
        feature_flag = FeatureFlag.new(name: flag_name, restricted: false)

        # In order to distinguish between manually created flags and these migrations
        # set the flag to a negative number
        first_ff = FeatureFlag.order(:id).first
        first_id = first_ff ? first_ff.id : 0
        feature_flag.id = first_id - 1
        feature_flag.save
      end
    end
  end

end
