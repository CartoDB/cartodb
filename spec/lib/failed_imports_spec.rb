# coding: UTF-8

require 'spec_helper'

describe CartoDB::Importer do
  homepath = File.expand_path('~')
  if File.exists? "#{homepath}/Dropbox/ec2-keys/.amazon_key"
    require 'aws-sdk'
    
    local_storage_dir = "/tmp/failed_files"
    unless File.directory? local_storage_dir
      Dir.mkdir(local_storage_dir)
    end
    
    s3 = AWS::S3.new({
      :access_key_id => File.open("#{homepath}/Dropbox/ec2-keys/.amazon_key", "rb").read.strip,
      :secret_access_key => File.open("#{homepath}/Dropbox/ec2-keys/.amazon_secret", "rb").read.strip
    })
    bucket = s3.buckets[:failed_imports]
    
    it "test failed files from S3" do
      bucket.objects.each do |remote_object|
        debugger
        #key = "temp/test_1333394922.csv"
        key = object.key
        name = key.split('/').last
        local_path = "/#{local_storage_dir}/#{name}"
        #remote_object = bucket.objects[key]
        remote_object.write(File.open(local_path,'w+'))
        if 0 == %x{wc -l #{local_path}}.split.first.to_i
          File.delete(local_path)
          #remote_object.delete
          warn 'empty file, skipping'
        else
          importer = create_importer local_path, 'import_file'
          result   = importer.import!
          result.name.should          == 'import_file'
        end
      end
    end
  else 
    warn "You don't have Vizzuality S3 keys available."
    warn "If you aren't from Vizzuality, this is normal."
  end
  ##################################################
  # configuration & helpers for tests
  ##################################################
  before(:all) do
    @db = CartoDB::ImportDatabaseConnection.connection
    @db_opts = {:database => "cartodb_importer_test", 
                :username => "postgres", :password => '',
                :host => 'localhost', 
                :port => 5432}
  end
  
  after(:all) do
    CartoDB::ImportDatabaseConnection.drop
  end
  def file file
    # File.expand_path("../../support/data/#{file}", __FILE__)    
    File.expand_path("/tmp/#{file}", __FILE__)    
  end
  
  def create_importer file_name, suggested_name=nil, is_url=false
    # sanity check
    throw "filename required" unless file_name
    
    # configure opts    
    if is_url
      opts = {:import_from_url => file_name}
    else
      opts = {:import_from_file => file_name}
    end
    opts[:suggested_name] = suggested_name if suggested_name.present?
    opts[:data_import_id] = get_data_import_id()
    opts[:remaining_quota] = 50000000
    # build importer
    CartoDB::Importer.new opts.reverse_merge(@db_opts)
  end        
  def check_schema(table, expected_schema, options={})
    table_schema = table.schema(:cartodb_types => options[:cartodb_types] || false)
    schema_differences = (expected_schema - table_schema) + (table_schema - expected_schema)
    schema_differences.should be_empty, "difference: #{schema_differences.inspect}"
  end         
  def get_data_import_id()
    @data_import  = DataImport.new(:user_id => 0)
    @data_import.updated_at = Time.now
    @data_import.save     
    @data_import.id
  end
end


