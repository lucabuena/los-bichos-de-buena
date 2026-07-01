export type PoolQuestion = {
  id: string
  text: string
  placeholder: string
  score: number
  zone: 'any' | 'kitchen' | 'office' | 'boardroom' | 'soho'
}

export const QUESTION_POOL: PoolQuestion[] = [
  // General — funny & weird
  { id: 'q_villain_origin', text: 'What\'s the most unhinged thing you\'ve ever done that you\'d describe as completely reasonable in context?', placeholder: 'Ok so hear me out...', score: 30, zone: 'any' },
  { id: 'q_hill_die_on', text: 'What\'s a completely trivial hill you would absolutely die on?', placeholder: 'I will never back down on...', score: 25, zone: 'any' },
  { id: 'q_childhood_phase', text: 'What was your most embarrassing childhood phase? Be specific. Cringe is mandatory.', placeholder: 'From ages X to Y I was really into...', score: 25, zone: 'any' },
  { id: 'q_weird_habit', text: 'What\'s your weirdest habit that you\'ve normalized to the point where you forget it\'s weird?', placeholder: 'I always...', score: 20, zone: 'any' },
  { id: 'q_irrational_belief', text: 'What\'s something you know is irrational but still low-key believe?', placeholder: 'Don\'t judge me but...', score: 30, zone: 'any' },
  { id: 'q_secret_skill', text: 'What\'s a completely useless skill you\'re oddly proud of?', placeholder: 'Nobody asks but I can...', score: 20, zone: 'any' },
  { id: 'q_wrong_hill', text: 'What\'s an opinion you\'ve been very confidently wrong about for years?', placeholder: 'I genuinely believed that...', score: 25, zone: 'any' },
  { id: 'q_villain_era', text: 'Describe your villain era. Everyone has one.', placeholder: 'It was a dark time. I was...', score: 35, zone: 'any' },
  { id: 'q_unhinged_belief', text: 'What\'s the most unhinged thing you believe about how the world actually works?', placeholder: 'Ok so I think...', score: 40, zone: 'any' },
  { id: 'q_fake_deep', text: 'What\'s something that sounds deep but is actually just you being weird?', placeholder: 'People think I\'m profound when I say...', score: 25, zone: 'any' },
  { id: 'q_identity_crisis', text: 'When was the last time you had a full identity crisis and what triggered it?', placeholder: 'It started when I realized...', score: 35, zone: 'any' },
  { id: 'q_alter_ego', text: 'If you had an alter ego, what would they be called and what would they do that you don\'t?', placeholder: 'My alter ego\'s name is...', score: 30, zone: 'any' },

  // Kitchen — food confessions & morning chaos
  { id: 'q_kitchen_crime', text: 'What\'s the worst food crime you\'ve ever committed? And would you do it again?', placeholder: 'I once put...', score: 20, zone: 'kitchen' },
  { id: 'q_kitchen_morning', text: 'What do you actually look like at 7am before you become a functional human?', placeholder: 'Picture a...', score: 20, zone: 'kitchen' },
  { id: 'q_kitchen_theft', text: 'Have you ever eaten someone else\'s food in a shared kitchen? Be honest.', placeholder: 'Ok technically...', score: 15, zone: 'kitchen' },
  { id: 'q_kitchen_ritual', text: 'What\'s your most unhinged morning routine step that you refuse to skip?', placeholder: 'Before I can function I must...', score: 20, zone: 'kitchen' },
  { id: 'q_kitchen_secret', text: 'What snack combo do you eat alone that you\'d never admit to in public?', placeholder: 'When nobody\'s watching I eat...', score: 15, zone: 'kitchen' },
  { id: 'q_kitchen_opinion', text: 'What\'s your most controversial food opinion? Defend it.', placeholder: 'I believe that...', score: 20, zone: 'kitchen' },

  // Office — work chaos & masks
  { id: 'q_office_autopilot', text: 'What do you do on autopilot at work that you only notice when someone else points it out?', placeholder: 'Apparently I always...', score: 25, zone: 'office' },
  { id: 'q_office_mask', text: 'What\'s the biggest difference between work-you and home-you? Be specific.', placeholder: 'At work I...', score: 35, zone: 'office' },
  { id: 'q_office_chaos', text: 'What\'s the most chaotic thing that\'s ever happened to you in a professional setting?', placeholder: 'So there was this one meeting...', score: 30, zone: 'office' },
  { id: 'q_office_fantasy', text: 'What\'s the most dramatic way you\'ve fantasized about quitting a job?', placeholder: 'In my head I stand up and say...', score: 35, zone: 'office' },
  { id: 'q_office_overshare', text: 'What\'s the most unprofessional thing you\'ve accidentally said or done in a work context?', placeholder: 'I will never forget when I...', score: 30, zone: 'office' },

  // Boardroom — power & delusion
  { id: 'q_board_first_decree', text: 'You\'re CEO for a day. What\'s your first completely unhinged decree?', placeholder: 'Effective immediately...', score: 40, zone: 'boardroom' },
  { id: 'q_board_manifesto', text: 'Write the opening line of your personal manifesto. No filter.', placeholder: 'I believe that...', score: 45, zone: 'boardroom' },
  { id: 'q_board_enemy', text: 'Who\'s your professional nemesis and why? (can be anonymous, a type, or a concept)', placeholder: 'It\'s people who...', score: 35, zone: 'boardroom' },
  { id: 'q_board_legacy', text: 'What would your Wikipedia page say about you if you died tomorrow? Write the first sentence.', placeholder: 'Known for...', score: 40, zone: 'boardroom' },
  { id: 'q_board_failure', text: 'What\'s a professional failure you\'ve totally made peace with but that shaped you permanently?', placeholder: 'I once completely...', score: 35, zone: 'boardroom' },

  // Soho — party mode, chaotic, late-night energy
  { id: 'q_soho_confess', text: 'It\'s after midnight. You\'re at a party. What\'s the thing you say that you regret at 9am?', placeholder: 'I would probably tell someone that...', score: 50, zone: 'soho' },
  { id: 'q_soho_dancefloor', text: 'What song makes you completely lose it on a dancefloor regardless of context?', placeholder: 'The second I hear...', score: 30, zone: 'soho' },
  { id: 'q_soho_3am', text: 'What\'s your 3am personality like? Be honest — not the version you want to be, the actual one.', placeholder: 'At 3am I am...', score: 50, zone: 'soho' },
  { id: 'q_soho_alter_ego', text: 'Who are you at a party vs who you are at work? Describe both like they\'re different characters.', placeholder: 'At work I\'m... but at a party I\'m...', score: 45, zone: 'soho' },
  { id: 'q_soho_unpopular', text: 'Hot take you only say with a drink in your hand.', placeholder: 'Ok I\'ll say it...', score: 40, zone: 'soho' },
  { id: 'q_soho_chaos', text: 'What\'s the most chaotic night out story you\'re actually proud of?', placeholder: 'It started innocently when...', score: 55, zone: 'soho' },
  { id: 'q_soho_truth', text: 'What\'s a truth about yourself you only admit when you\'re relaxed enough to stop performing?', placeholder: 'Honestly...', score: 60, zone: 'soho' },
  { id: 'q_soho_regret', text: 'What\'s something you almost did but didn\'t — and you still think about it?', placeholder: 'I almost...', score: 50, zone: 'soho' },
  { id: 'q_soho_karaoke', text: 'What\'s your go-to karaoke song and what does that say about you?', placeholder: 'I always pick... because...', score: 35, zone: 'soho' },
  { id: 'q_soho_wildcard', text: 'Give us one completely unverifiable fact about yourself.', placeholder: 'Believe it or not...', score: 45, zone: 'soho' },
]

export function getQuestionsForZone(zone: string, count = 4): PoolQuestion[] {
  const relevant = QUESTION_POOL.filter(q => q.zone === 'any' || q.zone === zone)
  const shuffled = [...relevant].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export const SOHO_UNLOCK_CHALLENGES = [
  'ug_coffee', 'ug_table', 'ug_fridge',
  'eg_reception', 'eg_plant',
  'og1_desk', 'og1_printer', 'og1_window',
  'og2_table', 'og2_screen', 'og2_window',
]
