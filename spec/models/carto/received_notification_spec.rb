require 'spec_helper_unit'

module Carto
  describe ReceivedNotification do
    before do
      @user = create(:carto_user)
      @notification = create(:notification)
      @user.reload
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
  end
end
