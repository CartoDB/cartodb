# encoding: utf-8
require_relative '../acceptance_helper'
require_relative '../../app/models/carto/user_notification'
require_relative '../../app/models/carto/notification'

feature "Notifications controller" do
  background do
    Capybara.current_driver = :rack_test
    @new_user = create_user(:password => "this_is_a_password")
  end

  scenario "Should be able to unsubscribe using the link" do
    @new_user.user_notifications.first.share_table.should be true
    hash = Carto::UserNotification.generate_unsubscribe_hash(@new_user, Carto::Notification::SHARE_TABLE_NOTIFICATION)
    get notifications_unsubscribe_url(notification_hash: hash) do |response|
      response.status.should == 200
      @new_user.reload
      @new_user.user_notifications.first.share_table.shoud be false
    end
  end
end
