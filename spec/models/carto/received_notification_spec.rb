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

    describe 'User#unread_received_notifications' do
      it 'does not list read notifications' do
        unread = create_received_notification(false)
        create_received_notification(true)

        expect(@user.received_notifications.unread).to eq [unread]
      end

      it 'sorted in decreasing date order' do
        unread1 = create_received_notification(false)
        Delorean.jump(5.seconds)
        unread2 = create_received_notification(false)
        Delorean.jump(5.seconds)
        unread3 = create_received_notification(false)
        Delorean.back_to_the_present

        expect(@user.received_notifications.unread).to eq [unread3, unread2, unread1]
      end
    end

    describe 'User#read_received_notifications' do
      it 'does not list unread notifications' do
        read = create_received_notification(true)
        create_received_notification(false)

        expect(@user.received_notifications.read).to eq [read]
      end

      it 'sorted in decreasing date order' do
        read1 = create_received_notification(true)
        Delorean.jump(5.seconds)
        read2 = create_received_notification(true)
        Delorean.jump(5.seconds)
        read3 = create_received_notification(true)
        Delorean.back_to_the_present

        expect(@user.received_notifications.read).to eq [read3, read2, read1]
      end
    end
  end
end
