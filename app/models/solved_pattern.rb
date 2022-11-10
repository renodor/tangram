# frozen_string_literal:true

class SolvedPattern < ApplicationRecord
  belongs_to :user
  belongs_to :pattern

  validates :pattern_id, uniqueness: { scope: :user_id }
end
