namespace :assets do
  desc 'Copy digest assets files to non-digest files'
  task :copy_non_digest_files do
    manifest = File.read("#{Rails.root}/public/assets/manifest.yml")
    manifest.each_line do |asset|
      if asset.include?(':')
        non_digest = asset.gsub(' ', '').split(':')[0].strip
        digest = asset.gsub(' ', '').split(':')[1].strip
        FileUtils.cp "#{Rails.root}/public/assets/#{digest}", "#{Rails.root}/public/assets/#{non_digest}"
      end
    end
  end

  # bundle exec rake assets:copy_coverband_assets
  desc 'Copy Coverband assets to production path'
  task :copy_coverband_assets do
    gem_path = Gem::Specification.find_by_name('coverband').full_gem_path
    src_path = "#{gem_path}/public/."
    dst_path = "#{Rails.root}/public/coverband"

    puts "Creating directory: #{dst_path}"
    FileUtils.mkdir_p(dst_path)

    puts "Copying files from #{src_path} to #{dst_path}"
    FileUtils.cp_r(src_path, dst_path)
  end
end
