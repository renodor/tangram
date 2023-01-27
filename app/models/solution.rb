# frozen_string_literal:true

class Solution < ApplicationRecord
  belongs_to :pattern
  has_many :polygons, dependent: :destroy

  def points_by_polygons_shape
    points = {}
    polygons.select(:shape, :points).each do |polygon|
      camelized_name = polygon.shape.camelize(:lower)
      points[camelized_name] = points[camelized_name] ? [points[camelized_name], polygon.points] : polygon.points
    end

    points
  end
end
