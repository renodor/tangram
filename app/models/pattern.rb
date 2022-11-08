# frozen_string_literal:true

class Pattern < ApplicationRecord
  has_many :polygons

  validates :name, presence: true
end
