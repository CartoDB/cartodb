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
        feature_flag.id = FeatureFlag.order(:id).last.id + 1
        feature_flag.save
      end
    end
  end

end
