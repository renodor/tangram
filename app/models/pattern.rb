# frozen_string_literal:true

class Pattern < ApplicationRecord
  has_many :polygons

  validates :name, presence: true

  def points_by_polygons_shape
    points = {}
    polygons.select(:shape, :points).each do |polygon|
      camelized_name = polygon.shape.camelize(:lower)
      if points[camelized_name]
        points[camelized_name] = [points[camelized_name], polygon.points]
      else
        points[camelized_name] = polygon.points
      end
    end

    points
  end
end
