export const getLevel = (totalExperience: number): number => {
  let level = 1;
  let experienceRequired = 100;
  while (totalExperience >= experienceRequired) {
    totalExperience -= experienceRequired;
    level += 1;
    experienceRequired = level * 100;
  }
  return level;
};

export const getExperienceForNextLevel = (level: number): number => {
  return level * 100;
};

export const getCurrentExperience = (totalExperience: number): number => {
  let level = 1;
  let experienceRequired = 100;
  while (totalExperience >= experienceRequired) {
    totalExperience -= experienceRequired;
    level += 1;
    experienceRequired = level * 100;
  }
  return totalExperience;
};
