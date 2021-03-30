require 'spec_helper_min'
require_relative '../../lib/importer/mail_notifier'
require          'active_support/core_ext' # Needed for string.blank?

describe CartoDB::Importer2::MailNotifier do

  START_TIME = 0

  before(:each) do
    @data_import = build(:data_import)
    @resque = mock
    @result = mock
    results = [@result]
    @mail_notifier = CartoDB::Importer2::MailNotifier.new(@data_import, results, @resque)
  end

  def set_import_duration duration
    @data_import.stubs(:created_at).once.returns(START_TIME)
    @data_import.stubs(:updated_at).once.returns(START_TIME + duration)
  end

  describe '#notify_if_needed' do

    it 'should send a mail if the import took more than MIN_IMPORT_TIME_TO_NOTIFY' do
      @data_import.stubs(:synchronization_id).once.returns(nil)
      error_text = { title: 'error stubbing' }
      @data_import.expects(:get_error_text).once.returns(error_text)
      set_import_duration(CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY + 1)
      @data_import.stubs(:user_id).once.returns(:any_user_id)
      @data_import.stubs(:stats).returns('[]')
      @data_import.stubs(:service_item_id).returns('filename.txt')
      @result.stubs(:success).returns(true)
      enqueue_params = :any_user_id, 1, 1, @result, @result, error_text, ['filename.txt']
      @resque.expects(:enqueue).with(::Resque::UserJobs::Mail::DataImportFinished, *enqueue_params).returns(true)

      @mail_notifier.notify_if_needed

      @mail_notifier.mail_sent?.should == true
    end
  end

  describe '#should_notify?' do
    def stub_notifiable_data_import
      set_import_duration(CartoDB::Importer2::MailNotifier::MIN_IMPORT_TIME_TO_NOTIFY + 1)
      @data_import.stubs(:synchronization_id).once.returns(nil)
      @data_import.stubs(:stats).returns('[]')
      @data_import.stubs(:service_item_id).returns('filename.txt')
    end

    it 'should return true if the import took more than MIN_IMPORT_TIME_TO_NOTIFY and was not a sync' do
      stub_notifiable_data_import

      @mail_notifier.should_notify?.should == true
    end

    it 'should return false if the import state is not finished' do
      stub_notifiable_data_import
      @data_import.stubs(:state).returns('pending')

      @mail_notifier.should_notify?.should == false
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
      @data_import.stubs(:user_id).once.returns(:any_user_id)
      @data_import.stubs(:stats).returns('[]')
      @data_import.stubs(:service_item_id).returns('filename.txt')
      error_text = { title: 'error stubbing' }
      @data_import.expects(:get_error_text).once.returns(error_text)
      enqueue_params = :any_user_id, 1, 1, @result, @result, error_text, ['filename.txt']
      @resque.expects(:enqueue).with(::Resque::UserJobs::Mail::DataImportFinished, *enqueue_params).returns(true)
      @result.stubs(:success).returns(true)
      @mail_notifier.send!
      @mail_notifier.mail_sent?.should == true
    end
  end

end
