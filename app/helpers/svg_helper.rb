# frozen_string_literal:true

module SvgHelper
  def svg(file_name, class_name = nil)
    # Create the path to the svgs directory
    file_path = "#{Rails.application.root}/app/assets/images/#{file_name}"
    file_path = "#{file_path}.svg" unless file_path.end_with? '.svg'

    # Create a cache hash
    hash = Digest::MD5.hexdigest "#{file_path.underscore}_#{class_name}"

    svg_content = Rails.cache.fetch "svg_file_#{hash}", expires_in: 1.year, cache_nils: false do
      if File.exist?(file_path)
        file = File.read(file_path)

        # parse svg
        doc = Nokogiri::HTML::DocumentFragment.parse file
        svg = doc.at_css 'svg'

        # attach class
        svg['class'] = class_name if class_name.present?

        # cast to html
        doc.to_html.html_safe
      end
    end

    return '(not found)' if svg_content.to_s.blank?

    svg_content
  end
end
