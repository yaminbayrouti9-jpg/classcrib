export const CHALLENGE_TEMPLATES = {
  Academic: [
    { title: "Study for 2 hours", target: 1 },
    { title: "Complete 3 Assignments", target: 3 },
    { title: "Review old notes", target: 1 }
  ],
  Eco: [
    { title: "Recycle 3 items", target: 3 },
    { title: "Use a reusable water bottle", target: 1 },
    { title: "Save electricity for 1h", target: 1 }
  ],
  Physical: [
    { title: "Walk 5k steps", target: 1 },
    { title: "Do 20 mins of exercise", target: 1 },
    { title: "Stretch in the morning", target: 1 }
  ]
};

export function generateMixChallenge() {
  const categories: (keyof typeof CHALLENGE_TEMPLATES)[] = ['Academic', 'Eco', 'Physical'];
  
  return categories.map(cat => {
    const templates = CHALLENGE_TEMPLATES[cat];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    return {
      category: cat,
      title: randomTemplate.title,
      target: randomTemplate.target,
      current: 0,
      completed: false
    };
  });
}
