class CommonData

  EMPTY_DATASETS = []

  def initialize
    @datasets = nil
    @tables = nil
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

  def self.upload_to_s3(filename, body)
    self.save_to_s3(filename, body)
  end

  private

  def self.save_to_s3(filename, body)
    s3_obj = s3_bucket.objects["common-data/#{filename}"]
    s3_obj.write({
        :data => body[],
        :acl => :public_read,
        :content_type => MIME::Types['application/zip']
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
    puts "Downloading #{table_name}"
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
    "https://#{Cartodb.config[:common_data]['username']}.cartodb.com/api/v1"
  end

  def api_key
    Cartodb.config[:common_data]['api_key']
  end


  def datasets_url
    privacy = Rails.env.development? ? '' : '&privacy=public'
    "#{base_url}/viz?page=1&per_page=500#{privacy}&type=table&api_key=#{api_key}"
  end


  def export_url(table_name)
    sql_api_url(export_query(table_name))
  end

  def tables_last_updated_url
    sql_api_url(tables_last_updated_query)
  end

  def sql_api_url(query)
    "#{base_url}/sql?api_key=#{api_key}&format=#{format}&q=#{URI::encode query}"
  end


  def tables_last_updated_query
    'select tabname as table_name, extract(epoch from updated_at) as updated_at from cdb_tablemetadata'
  end

  def export_query(table_name)
    "select * from #{table_name}"
  end


  def format
    Cartodb.config[:common_data]['format'] || 'shp'
  end

  def is_enabled
    Cartodb.config[:common_data].present? && Cartodb.config[:common_data]['username'] && Cartodb.config[:common_data]['api_key']
  end

  def generate_every
    Cartodb.config[:common_data]['generate_every'] || 86400
  end
end
