export type Challenge = {
  id: string
  text: string
  description: string
  type: 'approach' | 'answer' | 'stay'
  targetObject?: string
  question?: string
  placeholder?: string
  score: number
  completed?: boolean
}

export type InteractiveObject = {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  icon: string
  challengeId?: string
  type: 'object' | 'elevator' | 'stairs_up' | 'stairs_down' | 'game_room'
  targetFloor?: number
  gameType?: 'tenant_or_colleague' | 'kiez_sorting' | 'speed_round'
}

export type Floor = {
  id: number
  name: string
  shortName: string
  bgColor: string
  floorColor: string
  carpetColor: string
  accentColor: string
  challenges: Challenge[]
  objects: InteractiveObject[]
  spawnX: number
  spawnY: number
}

export const ALL_CHALLENGE_IDS = [
  'ug_coffee', 'ug_table', 'ug_fridge',
  'eg_reception', 'eg_plant', 'eg_elevator',
  'og1_desk', 'og1_printer', 'og1_window',
  'og2_table', 'og2_screen', 'og2_window',
  'soho_bar', 'soho_booth', 'soho_dancefloor',
]

// Challenge IDs that require a written answer (used to find completers)
export const ANSWER_CHALLENGE_IDS = [
  'ug_coffee', 'ug_table', 'ug_fridge',
  'eg_reception',
  'og1_desk', 'og1_printer', 'og1_window',
  'og2_table', 'og2_screen', 'og2_window',
  'soho_bar', 'soho_booth', 'soho_dancefloor',
]

export const FLOORS: Floor[] = [
  {
    id: 0,
    name: 'B — Kitchen',
    shortName: 'B',
    bgColor: '#0f1a0f',
    floorColor: '#c8b89a',
    carpetColor: '#b5a080',
    accentColor: '#4ade80',
    spawnX: 400,
    spawnY: 400,
    challenges: [
      {
        id: 'ug_coffee',
        text: 'Get yourself a coffee',
        description: 'Go to the coffee machine.',
        type: 'answer',
        targetObject: 'coffee_machine',
        question: 'What\'s your actual morning routine — not the aspirational one, the real one?',
        placeholder: 'Honestly, I wake up and...',
        score: 15,
      },
      {
        id: 'ug_table',
        text: 'Claim a lunch table',
        description: 'Sit down at one of the tables.',
        type: 'answer',
        targetObject: 'lunch_table',
        question: 'What\'s a food opinion you hold that would genuinely upset people if they knew?',
        placeholder: 'I think that...',
        score: 15,
      },
      {
        id: 'ug_fridge',
        text: 'Investigate the fridge',
        description: 'Open the fridge. Something weird is always in there.',
        type: 'answer',
        targetObject: 'fridge',
        question: 'What does your fridge at home look like right now? Forensic detail please.',
        placeholder: 'Ok so there\'s a suspicious...',
        score: 20,
      },
    ],
    objects: [
      { id: 'coffee_machine', x: 120, y: 120, w: 50, h: 60, label: 'Coffee Machine', icon: '☕', type: 'object' },
      { id: 'fridge', x: 220, y: 100, w: 60, h: 80, label: 'Fridge', icon: '🧊', type: 'object' },
      { id: 'lunch_table', x: 500, y: 280, w: 180, h: 100, label: 'Lunch Table', icon: '🍽️', type: 'object' },
      { id: 'lunch_table2', x: 750, y: 280, w: 180, h: 100, label: 'Lunch Table', icon: '🍽️', type: 'object' },
      { id: 'stairs_up_ug', x: 950, y: 380, w: 80, h: 100, label: 'GF →', icon: '🪜', type: 'stairs_up', targetFloor: 1 },
      { id: 'game_room_b', x: 700, y: 100, w: 55, h: 90, label: 'Mieter?', icon: '🎮', type: 'game_room', gameType: 'tenant_or_colleague' },
    ],
  },
  {
    id: 1,
    name: 'GF — Reception',
    shortName: 'GF',
    bgColor: '#0f0f1a',
    floorColor: '#d4cfc8',
    carpetColor: '#6b7c8a',
    accentColor: '#60a5fa',
    spawnX: 200,
    spawnY: 400,
    challenges: [
      {
        id: 'eg_reception',
        text: 'Check in at reception',
        description: 'Go to the reception desk.',
        type: 'answer',
        targetObject: 'reception',
        question: 'How would you introduce yourself in one sentence if you couldn\'t mention your job, your city, or anything on your LinkedIn?',
        placeholder: 'I\'m someone who...',
        score: 20,
      },
      {
        id: 'eg_plant',
        text: 'Find the favourite plant',
        description: 'There\'s a plant everyone knows.',
        type: 'approach',
        targetObject: 'big_plant',
        score: 5,
      },
      {
        id: 'eg_elevator',
        text: 'Take the lift to 1F',
        description: 'The lift is waiting.',
        type: 'approach',
        targetObject: 'elevator_eg',
        score: 0,
      },
    ],
    objects: [
      { id: 'reception', x: 350, y: 160, w: 200, h: 80, label: 'Reception', icon: '💁', type: 'object' },
      { id: 'big_plant', x: 680, y: 180, w: 50, h: 60, label: 'Klaus (Plant)', icon: '🌿', type: 'object' },
      { id: 'couch', x: 750, y: 300, w: 160, h: 70, label: 'Waiting Area', icon: '🛋️', type: 'object' },
      { id: 'elevator_eg', x: 950, y: 180, w: 70, h: 100, label: 'Lift', icon: '🛗', type: 'elevator', targetFloor: 2 },
      { id: 'stairs_down_eg', x: 100, y: 400, w: 80, h: 100, label: 'B ↓', icon: '🪜', type: 'stairs_down', targetFloor: 0 },
      { id: 'game_room_gf', x: 520, y: 300, w: 55, h: 90, label: 'Kiez?', icon: '🎮', type: 'game_room', gameType: 'kiez_sorting' },
      { id: 'stairs_up_eg', x: 950, y: 400, w: 80, h: 80, label: '1F →', icon: '🪜', type: 'stairs_up', targetFloor: 2 },
    ],
  },
  {
    id: 2,
    name: '1F — Cubicles',
    shortName: '1F',
    bgColor: '#1a1020',
    floorColor: '#5c6b7a',
    carpetColor: '#4a5568',
    accentColor: '#c084fc',
    spawnX: 200,
    spawnY: 450,
    challenges: [
      {
        id: 'og1_desk',
        text: 'Find your spot',
        description: 'Sit down at a free desk.',
        type: 'answer',
        targetObject: 'desk_row1',
        question: 'What\'s the most unhinged object on your desk at home and why is it there?',
        placeholder: 'There\'s this one thing...',
        score: 15,
      },
      {
        id: 'og1_printer',
        text: 'Wait at the printer',
        description: 'Everyone has a printer story.',
        type: 'answer',
        targetObject: 'printer',
        question: 'What\'s the most chaotic or embarrassing thing that\'s ever happened to you in a work meeting?',
        placeholder: 'So there was this one time on a call...',
        score: 30,
      },
      {
        id: 'og1_window',
        text: 'Stare out the window dramatically',
        description: 'A classic move.',
        type: 'answer',
        targetObject: 'window_og1',
        question: 'What\'s the daydream you have on autopilot when you zone out at work?',
        placeholder: 'I\'m usually imagining...',
        score: 25,
      },
    ],
    objects: [
      { id: 'desk_row1', x: 150, y: 150, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row2', x: 280, y: 150, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row3', x: 410, y: 150, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row4', x: 150, y: 270, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row5', x: 280, y: 270, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row6', x: 410, y: 270, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row7', x: 620, y: 150, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row8', x: 750, y: 150, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row9', x: 620, y: 270, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'desk_row10', x: 750, y: 270, w: 90, h: 60, label: 'Desk', icon: '💻', type: 'object' },
      { id: 'printer', x: 880, y: 200, w: 70, h: 60, label: 'Printer', icon: '🖨️', type: 'object' },
      { id: 'window_og1', x: 400, y: 80, w: 120, h: 40, label: 'Window', icon: '🪟', type: 'object' },
      { id: 'elevator_og1', x: 950, y: 180, w: 70, h: 100, label: 'Lift', icon: '🛗', type: 'elevator', targetFloor: 3 },
      { id: 'stairs_down_og1', x: 100, y: 430, w: 80, h: 80, label: 'GF ↓', icon: '🪜', type: 'stairs_down', targetFloor: 1 },
      { id: 'game_room_1f', x: 550, y: 370, w: 55, h: 90, label: 'Mieter?', icon: '🎮', type: 'game_room', gameType: 'tenant_or_colleague' },
      { id: 'stairs_up_og1', x: 950, y: 400, w: 80, h: 80, label: '2F →', icon: '🪜', type: 'stairs_up', targetFloor: 3 },
    ],
  },
  {
    id: 3,
    name: '2F — Boardroom',
    shortName: '2F',
    bgColor: '#1a0f0a',
    floorColor: '#3d2b1a',
    carpetColor: '#2a1f12',
    accentColor: '#fb923c',
    spawnX: 200,
    spawnY: 450,
    challenges: [
      {
        id: 'og2_table',
        text: 'Take a seat at the boardroom table',
        description: 'Sit down at the big table.',
        type: 'answer',
        targetObject: 'boardroom_table',
        question: 'You\'re CEO for one day. First decree — make it weird, make it count.',
        placeholder: 'Effective immediately...',
        score: 40,
      },
      {
        id: 'og2_screen',
        text: 'Take the whiteboard',
        description: 'Write something. Anything.',
        type: 'answer',
        targetObject: 'whiteboard',
        question: 'Write the opening line of your personal manifesto. No filter, no corporate speak.',
        placeholder: 'I believe that...',
        score: 50,
      },
      {
        id: 'og2_window',
        text: 'Gaze at the city like a villain',
        description: '2F has the best view. You\'ve earned it.',
        type: 'answer',
        targetObject: 'window_og2',
        question: 'What would your Wikipedia page say if you died tomorrow? Write the first sentence.',
        placeholder: 'Known for...',
        score: 35,
      },
    ],
    objects: [
      { id: 'boardroom_table', x: 280, y: 200, w: 440, h: 180, label: 'Boardroom Table', icon: '🪑', type: 'object' },
      { id: 'whiteboard', x: 150, y: 130, w: 120, h: 60, label: 'Whiteboard', icon: '📋', type: 'object' },
      { id: 'window_og2', x: 500, y: 80, w: 180, h: 40, label: 'City View', icon: '🏙️', type: 'object' },
      { id: 'elevator_og2', x: 950, y: 360, w: 70, h: 100, label: 'Lift', icon: '🛗', type: 'elevator', targetFloor: 1 },
      { id: 'stairs_down_og2', x: 100, y: 430, w: 80, h: 80, label: '1F ↓', icon: '🪜', type: 'stairs_down', targetFloor: 2 },
      { id: 'game_room_2f', x: 750, y: 370, w: 55, h: 90, label: 'Kiez?', icon: '🎮', type: 'game_room', gameType: 'kiez_sorting' },
      { id: 'soho_door', x: 820, y: 100, w: 120, h: 300, label: 'Soho House', icon: '🚪', type: 'stairs_up', targetFloor: 4 },
    ],
  },
  {
    id: 4,
    name: 'Soho House',
    shortName: '🍸',
    bgColor: '#0a0008',
    floorColor: '#1a0a1a',
    carpetColor: '#2a1025',
    accentColor: '#f472b6',
    spawnX: 300,
    spawnY: 400,
    challenges: [
      {
        id: 'soho_bar',
        text: 'Order something at the bar',
        description: 'Walk up to the bar.',
        type: 'answer',
        targetObject: 'bar_counter',
        question: 'It\'s after midnight and you\'re feeling dangerously honest. What do you say that you\'ll regret at 9am tomorrow?',
        placeholder: 'I would probably tell someone that...',
        score: 55,
      },
      {
        id: 'soho_booth',
        text: 'Slide into a booth',
        description: 'The dark corner booth. Classic.',
        type: 'answer',
        targetObject: 'booth',
        question: 'What\'s a truth about yourself you only admit when you\'ve stopped performing for the night?',
        placeholder: 'Honestly...',
        score: 60,
      },
      {
        id: 'soho_dancefloor',
        text: 'Hit the dancefloor',
        description: 'Don\'t overthink it.',
        type: 'answer',
        targetObject: 'dancefloor',
        question: 'What song turns you into a completely different person the second it starts playing?',
        placeholder: 'The second I hear...',
        score: 40,
      },
    ],
    objects: [
      { id: 'bar_counter', x: 150, y: 100, w: 300, h: 70, label: 'Bar', icon: '🍸', type: 'object' },
      { id: 'booth', x: 700, y: 150, w: 180, h: 120, label: 'Booth', icon: '🛋️', type: 'object' },
      { id: 'dancefloor', x: 300, y: 300, w: 300, h: 180, label: 'Dancefloor', icon: '🕺', type: 'object' },
      { id: 'stairs_down_soho', x: 100, y: 430, w: 80, h: 80, label: '2F ↓', icon: '🪜', type: 'stairs_down', targetFloor: 3 },
      { id: 'game_room_soho', x: 660, y: 290, w: 55, h: 90, label: 'Speed', icon: '🎮', type: 'game_room', gameType: 'speed_round' },
    ],
  },
]
