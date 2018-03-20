require 'spec_helper_min'

describe 'CartoDB::FileUpload' do
  it 'retries S3 upload if it times out' do
    file_upload = CartoDB::FileUpload.new(Cartodb.get_config(:user_migrator, :uploads_path))

    should_upload_to_s3_after_retrying

    file_upload.upload_file_to_s3(file.path, 'wadus','some_token', s3_config)
  end

  it 'retries CartoDB::FileUpload::MAX_S3_UPLOAD_ATTEMPTS at most' do
    should_timeout_uploading_to_s3

    file_upload = CartoDB::FileUpload.new(Cartodb.get_config(:user_migrator, :uploads_path))

    expect {
      file_upload.upload_file_to_s3(file.path, 'wadus','some_token', s3_config)
    }.to raise_error(AWS::S3::Errors::RequestTimeout)
  end

  def file
    Tempfile.new('foo')
  end

  def should_upload_to_s3_after_retrying
    object_mock = Object.new

    objects_array_mock = Object.new
    objects_array_mock.stubs(:[]).returns(object_mock)

    bucket_mock = Object.new
    bucket_mock.expects(:objects).twice.returns(objects_array_mock)

    s3_mock = Object.new
    s3_mock.expects(:buckets).twice.returns('some_bucket_name' => bucket_mock)

    AWS::S3.stubs(:new).returns(s3_mock)

    object_mock.stubs(:write).raises(AWS::S3::Errors::RequestTimeout.new).then.returns(true)
    object_mock.expects(:url_for).once
  end

  def should_timeout_uploading_to_s3
    object_mock = Object.new

    objects_array_mock = Object.new
    objects_array_mock.stubs(:[]).returns(object_mock)

    bucket_mock = Object.new
    bucket_mock.expects(:objects).times(3).returns(objects_array_mock)

    s3_mock = Object.new
    s3_mock.expects(:buckets).times(3).returns('some_bucket_name' => bucket_mock)

    AWS::S3.stubs(:new).returns(s3_mock)

    object_mock.stubs(:write).times(3).raises(AWS::S3::Errors::RequestTimeout.new)
  end

  def s3_config
    s3_config = Cartodb.get_config(:user_migrator, 's3').dup
    s3_config['access_key_id'] = 'some_access_key_id'
    s3_config['secret_access_key'] = 'some_secret_access_key'
    s3_config['bucket_name'] = 'some_bucket_name'
    s3_config
  end
end
