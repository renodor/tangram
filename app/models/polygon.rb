# frozen_string_literal:true

class Polygon < ApplicationRecord
  belongs_to :pattern

  validates :shape, :points, presence: true

  enum shape: {
    big_triangle: 0,
    medium_triangle: 1,
    small_triangle: 2,
    cube: 3,
    parallelogram: 4
  }
end
