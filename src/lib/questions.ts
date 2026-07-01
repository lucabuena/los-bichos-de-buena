export type Question = {
  key: string
  text: string
  placeholder: string
  score: number // how much this question contributes to the Bicho score
}

export type Level = {
  id: number
  title: string
  subtitle: string
  color: string
  bgColor: string
  questions: Question[]
}

export const LEVELS: Level[] = [
  {
    id: 0,
    title: "The Surface",
    subtitle: "Who are you... allegedly?",
    color: "#4ade80",
    bgColor: "#052e16",
    questions: [
      {
        key: "childhood_superpower",
        text: "What superpower did you have as a child that you miss today?",
        placeholder: "e.g. I could spend hours thinking about nothing...",
        score: 5,
      },
      {
        key: "unpopular_opinion",
        text: "Your most unpopular opinion that you would never give up.",
        placeholder: "Tell the truth.",
        score: 10,
      },
    ],
  },
  {
    id: 1,
    title: "The Past",
    subtitle: "What made you?",
    color: "#60a5fa",
    bgColor: "#0c1445",
    questions: [
      {
        key: "defining_moment",
        text: "A moment from your past that changed everything. Nobody at Buena knows about it.",
        placeholder: "Can be small. Just has to feel real.",
        score: 20,
      },
      {
        key: "childhood_belief",
        text: "Something you believed was absolutely true as a child.",
        placeholder: "The more absurd the better.",
        score: 15,
      },
    ],
  },
  {
    id: 2,
    title: "The Philosophy",
    subtitle: "What do you actually believe?",
    color: "#f472b6",
    bgColor: "#2d0a1f",
    questions: [
      {
        key: "unanswered_question",
        text: "A question that has haunted you for years and that you can't answer.",
        placeholder: "The question itself is the answer.",
        score: 25,
      },
      {
        key: "weird_belief",
        text: "A belief you hold but never say out loud because most people wouldn't understand it.",
        placeholder: "It's safe here.",
        score: 30,
      },
    ],
  },
  {
    id: 3,
    title: "The Core",
    subtitle: "The strange truth.",
    color: "#fb923c",
    bgColor: "#1a0a00",
    questions: [
      {
        key: "strangest_phase",
        text: "The strangest phase of your life. What happened?",
        placeholder: "No judgment. Promise.",
        score: 35,
      },
      {
        key: "secret_skill",
        text: "A skill or piece of knowledge you have that nobody at work knows about.",
        placeholder: "Can be useful or completely pointless.",
        score: 20,
      },
    ],
  },
]

export const getTotalWeirdness = (answeredKeys: string[]): number => {
  let total = 0
  for (const level of LEVELS) {
    for (const q of level.questions) {
      if (answeredKeys.includes(q.key)) {
        total += q.score
      }
    }
  }
  return total
}
