# frozen_string_literal:true

class Pattern < ApplicationRecord
  has_many :solutions
  has_many :solved_patterns
  has_many :users, through: :solved_patterns

  validates :name, presence: true

  scope :ordered, -> { order(:order) }

  def solved?(user = nil)
    return false unless user

    SolvedPattern.find_by(pattern_id: id, user_id: user.id).present?
  end
end
