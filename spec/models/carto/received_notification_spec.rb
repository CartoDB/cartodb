# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe ReceivedNotification do
    before(:all) do
      @user = FactoryGirl.create(:carto_user)
    end

    before(:each) do
      @notification = FactoryGirl.create(:notification)
      @user.reload
    end

    after(:each) do
      @notification.destroy
    end

    after(:all) do
      @user.destroy
    end

    def create_received_notification(read)
      @user.received_notifications.create!(
        notification: @notification,
        received_at: DateTime.now,
        read_at: read ? DateTime.now : nil
      )
    end

  end
end
