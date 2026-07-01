export type Encounter = {
  id: string
  setting: string // "in the kitchen", "in the meeting room"
  intro: (name: string) => string
  question: string
  placeholder: string
  score: number
}

export const ENCOUNTERS: Encounter[] = [
  {
    id: 'kitchen_coffee',
    setting: 'Kitchen',
    intro: (name) => `${name} is waiting for the coffee and looks at you.`,
    question: 'What was the strangest phase of your life?',
    placeholder: 'I once went through a phase where I...',
    score: 25,
  },
  {
    id: 'kitchen_lunch',
    setting: 'Kitchen',
    intro: (name) => `${name} is eating alone and spontaneously asks you:`,
    question: 'If you wake up tomorrow and everything is different — what do you hope has changed?',
    placeholder: 'I\'d wake up and...',
    score: 30,
  },
  {
    id: 'office_desk',
    setting: 'Office',
    intro: (name) => `${name} briefly looks up from their screen.`,
    question: 'What do you think most people here get wrong about you?',
    placeholder: 'Most people think I\'m...',
    score: 35,
  },
  {
    id: 'office_hallway',
    setting: 'Hallway',
    intro: (name) => `${name} and you are walking through the hallway at the same time.`,
    question: 'A belief you hold but never say out loud — because most people wouldn\'t understand it.',
    placeholder: 'I genuinely believe that...',
    score: 40,
  },
  {
    id: 'meeting_after',
    setting: 'Meeting Room',
    intro: (name) => `After the meeting, ${name} asks you:`,
    question: 'What kept you so absorbed as a child that you could lose hours in it?',
    placeholder: 'As a child I could spend hours...',
    score: 20,
  },
  {
    id: 'soho_bar',
    setting: 'Soho House Bar',
    intro: (name) => `${name} orders the same thing as you and turns around.`,
    question: 'A moment in your past that changed everything. One you\'d never bring up at work.',
    placeholder: 'It was when I...',
    score: 50,
  },
  {
    id: 'soho_terrace',
    setting: 'Soho House Terrace',
    intro: (name) => `${name} is sitting outside staring into the distance. You sit down next to them.`,
    question: 'If you could say one sentence to your 10-year-old self — what would it be?',
    placeholder: 'I\'d tell them...',
    score: 45,
  },
]

export const SOHO_ENCOUNTERS: Encounter[] = ENCOUNTERS.filter(e =>
  e.setting.includes('Soho')
)

export const OFFICE_ENCOUNTERS: Encounter[] = ENCOUNTERS.filter(e =>
  !e.setting.includes('Soho')
)

export function getRandomEncounter(zone: 'office' | 'soho'): Encounter {
  const pool = zone === 'soho' ? SOHO_ENCOUNTERS : OFFICE_ENCOUNTERS
  return pool[Math.floor(Math.random() * pool.length)]
}
