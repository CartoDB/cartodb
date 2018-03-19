require 'spec_helper_min'

describe 'CartoDB::FileUpload' do
  it 'retries S3 upload if it times out' do
    file_upload = CartoDB::FileUpload.new(Cartodb.get_config(:user_migrator, :uploads_path))

    should_upload_to_s3

    file_upload.upload_file_to_storage(
      file_param: Tempfile.new('foo').path,
      s3_config: s3_config,
      allow_spaces: true,
      force_s3_upload: true,
      random_token: Cartodb.get_config(:user_migrator, :uploads_path)
    )
  end

  it 'retries CartoDB::FileUpload::MAX_S3_UPLOAD_ATTEMPTS at most' do
    AWS::S3.expects(:new).times(CartoDB::FileUpload::MAX_S3_UPLOAD_ATTEMPTS).raises(AWS::S3::Errors::RequestTimeout.new)

    file_upload = CartoDB::FileUpload.new(Cartodb.get_config(:user_migrator, :uploads_path))

    expect do
      file_upload.upload_file_to_storage(
        file_param: Tempfile.new('foo').path,
        s3_config: s3_config,
        allow_spaces: true,
        force_s3_upload: true,
        random_token: Cartodb.get_config(:user_migrator, :uploads_path)
      )
    end.to raise_error(AWS::S3::Errors::RequestTimeout)
  end

  def should_upload_to_s3
    object_mock = Object.new
    object_mock.expects(:write).once
    object_mock.expects(:url_for).once

    objects_array_mock = Object.new
    objects_array_mock.stubs(:[]).returns(object_mock)

    bucket_mock = Object.new
    bucket_mock.expects(:objects).once.returns(objects_array_mock)

    s3_mock = Object.new
    s3_mock.expects(:buckets).once.returns({'some_bucket_name' => bucket_mock})

    AWS::S3.stubs(:new).raises(AWS::S3::Errors::RequestTimeout.new).then.returns(s3_mock)
  end

  def s3_config
    s3_config = Cartodb.get_config(:user_migrator, 's3').dup
    s3_config['access_key_id'] = 'some_access_key_id'
    s3_config['secret_access_key'] = 'some_secret_access_key'
    s3_config['bucket_name'] = 'some_bucket_name'
    s3_config
  end
end