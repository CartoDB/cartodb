# encoding: UTF-8

require_relative '../../lib/importer/mail_notifier'
require_relative '../../../../app/models/carto/notification'
require_relative '../../../../spec/rspec_configuration.rb'

describe CartoDB::Importer2::MailNotifier do

  START_TIME = 0

  before(:each) do
    @data_import = mock
    @user = mock
    @user.stubs(:id).returns(:any_user_id)
    @user.stubs(:is_subscribed_to?).returns(true)
    @user.stubs(:has_feature_flag?).returns(true)
    @resque = mock
    @result = mock
    results = [@result]
    @mail_notifier = CartoDB::Importer2::MailNotifier.new(@data_import, @user, results, @resque)
  end

  def set_import_duration duration
    @data_import.stubs(:created_at).once.returns(START_TIME)
    @data_import.stubs(:updated_at).once.returns(START_TIME + duration)
  end

  describe '#notify_if_needed' do

    it 'should send a mail if the import took more than MIN_IMPORT_TIME_TO_NOTIFY' do
      @data_import.stubs(:synchronization_id).once.returns(nil)
      set_import_duration(::CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY + 1)
      @result.stubs(:success).returns(true)
      @resque.expects(:enqueue).with(::Resque::UserJobs::Mail::DataImportFinished, :any_user_id, 1, 1, @result, @result, nil).returns(true)

      @mail_notifier.notify_if_needed
      @mail_notifier.mail_sent?.should == true
    end
  end

  describe '#should_notify?' do
    it 'should return true if the import took more than MIN_IMPORT_TIME_TO_NOTIFY and was not a sync' do
      set_import_duration(CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY + 1)
      @data_import.stubs(:synchronization_id).once.returns(nil)

      @mail_notifier.should_notify?.should == true
    end

    it 'should return false if the import took less than MIN_IMPORT_TIME_TO_NOTIFY' do
      set_import_duration(CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY - 1)

      @mail_notifier.should_notify?.should == false
    end

    it 'should return false if it was a sync import' do
      set_import_duration(CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY + 1)
      ANY_SYNC_ID = 1
      @data_import.stubs(:synchronization_id).once.returns(ANY_SYNC_ID)

      @mail_notifier.should_notify?.should == false
    end
  end

  describe '#send!' do
    it 'should inconditionally send a mail to the user who triggered the import' do
      @resque.expects(:enqueue).with(::Resque::UserJobs::Mail::DataImportFinished, :any_user_id, 1, 1, @result, @result, nil).returns(true)
      @result.stubs(:success).returns(true)
      @mail_notifier.send!
      @mail_notifier.mail_sent?.should == true
    end
  end

end
