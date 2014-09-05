class CommonData

  EMPTY_DATASETS = []

  def initialize
    @datasets = nil
    @user = nil
  end

  def datasets
    if @datasets.nil?

      _datasets = EMPTY_DATASETS

      if is_enabled
        begin
          response = Typhoeus.get(datasets_url, followlocation:true)
          if [200, 201].include?(response.code)
            visualizations = JSON.parse(response.response_body)
            _datasets = visualizations.fetch('visualizations', EMPTY_DATASETS)
          end
        rescue
          _datasets = EMPTY_DATASETS
        end
      end

      @datasets = _datasets
    end

    @datasets
  end

  def assets_to_upload(all_public)
    datasets_to_generate(all_public).each { |dataset|
      table_name = dataset['table']['name']
      yield({ :table_name => table_name, :body => lambda { asset table_name } })
    }
  end

  def update_table_metadata(table_name)
    table = Table.get_by_id_or_name(table_name, common_data_user)
    if table
      table.update_cdb_tablemetadata
    end
  end

  def self.upload_to_s3(filename, body)
    self.save_to_s3(filename, body)
  end

  private

  def self.save_to_s3(filename, body)
    s3_obj = s3_bucket.objects[filename]

    s3_obj.write({
        :data => body,
        :acl => :public_read
    })
    s3_obj.public_url.to_s
  end

  def self.s3_bucket
    AWS.config(Cartodb.config[:aws]["s3"])
    s3 = AWS::S3.new
    bucket_name = Cartodb.config[:common_data]["s3_bucket_name"]
    s3.buckets[bucket_name]
  end

  def asset(table_name)
    response = Typhoeus.get(export_url(table_name), followlocation:true)
    raise URI::InvalidURIError unless [200, 201].include?(response.code)
    response.response_body
  end

  def datasets_to_generate(all_public=false)
    tagged_datasets = datasets.select { |dataset|
      !dataset['tags'].empty?
    }
    private_datasets = tagged_datasets.select { |dataset|
      dataset['privacy'].downcase == CartoDB::Visualization::Member::PRIVACY_PRIVATE.downcase
    }
    public_datasets = tagged_datasets.select { |dataset|
      dataset['privacy'].downcase == CartoDB::Visualization::Member::PRIVACY_PUBLIC.downcase
    }

    unless all_public
      public_datasets = public_datasets.select { |dataset|
        Time.now.utc - Time.parse(dataset['table']['updated_at']) < generate_every
      }
    end

    private_datasets + public_datasets
  end

  def base_url
    "#{config('protocol', 'https')}://#{config('username')}.#{config('host')}/api/v1"
  end


  def datasets_url
    privacy = Rails.env.development? ? '' : '&privacy=public'
    puts "#{base_url}/viz?page=1&per_page=500#{privacy}&type=table&exclude_shared=true&api_key=#{config('api_key')}"
    "#{base_url}/viz?page=1&per_page=500#{privacy}&type=table&exclude_shared=true&api_key=#{config('api_key')}"
  end

  def export_url(table_name)
    sql_api_url(table_name)
  end

  def sql_api_url(table_name)
    "#{base_url}/sql?api_key=#{config('api_key')}&format=#{config('format', 'shp')}&filename=#{table_name}&q=#{URI::encode export_query(table_name)}"
  end

  def export_query(table_name)
    "select * from #{table_name}"
  end

  def is_enabled
    !config('username').nil? && !config('api_key').nil?
  end

  def generate_every
    config('generate_every', 86400)
  end

  def common_data_user
    @user ||= User.where(username: config('username')).first
  end

  def config(key, default=nil)
    if Cartodb.config[:common_data].present?
      Cartodb.config[:common_data][key].present? ? Cartodb.config[:common_data][key] : default
    else
      default
    end
  end
end
