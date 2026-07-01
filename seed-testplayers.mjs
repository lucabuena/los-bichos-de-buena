import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://exqequijsiflwzieqhhg.supabase.co',
  'sb_publishable_gigop5aFACOvHYiumhtHYQ_mopRUNwp'
)

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6', '#c77dff', '#ff9a3c', '#00f5d4']
const SHAPES = ['round', 'spiky', 'blobby', 'square']
const EYES = ['normal', 'wide', 'sleepy', 'cross']

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const PLAYERS = [
  {
    name: 'Jan Müller',
    email: 'jan@buena.com',
    level: 2,
    weirdness: 65,
    answers: [
      { key: 'ug_coffee', text: 'Ich brauche keinen Kaffee, ich brauche 10 Minuten absolute Stille. Das macht mich zum ruhigsten und gleichzeitig unangenehmsten Morgen-Menschen bei Buena.' },
      { key: 'ug_fridge', text: 'In meinem Kühlschrank: halb aufgegessene Reste von Gerichten die ich "experimentell" nennen würde, drei verschiedene Senfarten, und irgendwas in Frischhaltefolie das ich nicht mehr anschauen möchte.' },
      { key: 'eg_reception', text: 'Ich bin jemand der in fremden Städten immer die falsche U-Bahn nimmt — aber meistens landen wir irgendwo interessanterem.' },
    ]
  },
  {
    name: 'Sara Kowalski',
    email: 'sara@buena.com',
    level: 3,
    weirdness: 110,
    answers: [
      { key: 'ug_coffee', text: 'Ich brauche das erste Koffein und exakt eine Podcast-Episode über etwas komplett Irrelevantes — heute: die Geschichte der Briefmarken in Bhutan.' },
      { key: 'ug_fridge', text: 'Drei verschiedene Hummus-Sorten (ich teste sie wissenschaftlich), Oat Milk obwohl ich Milch eigentlich okay finde, und hinten eine Flasche Sekt die seit 8 Monaten "für einen besonderen Anlass" wartet.' },
      { key: 'eg_reception', text: 'Ich bin jemand der jedem Kellner aufrichtig Danke sagt und danach kurz überlegt ob das jetzt weird war.' },
      { key: 'og1_desk', text: 'Auf meinem Schreibtisch steht ein kleiner Stein den ich von einem Strand in Portugal mitgenommen habe. Keine Ahnung warum. Er gibt mir das Gefühl dass ich jederzeit verschwinden könnte.' },
      { key: 'og1_printer', text: 'Ich habe mal in einem All-Hands eine Folie mit dem falschen Bild präsentiert. Es war ein Screenshot von einer Textnachricht. Es war nicht meine.' },
    ]
  },
  {
    name: 'Felix Hartmann',
    email: 'felix@buena.com',
    level: 1,
    weirdness: 35,
    answers: [
      { key: 'ug_coffee', text: 'Ich brauche Stille und einen langen Weg zur Arbeit. Wenn ich zu früh ankomme bin ich noch nicht fertig mit dem Übergang zwischen Privatperson und Arbeitsperson.' },
      { key: 'ug_fridge', text: 'Genau das was man dort erwarten würde — und das finde ich selbst verdächtig.' },
    ]
  },
  {
    name: 'Mia Bauer',
    email: 'mia@buena.com',
    level: 3,
    weirdness: 145,
    answers: [
      { key: 'ug_coffee', text: 'Ich brauche das Gefühl dass der Tag noch nicht angefangen hat, auch wenn er schon zwei Stunden läuft. Erste Stunde: Autopilot. Kein Kaffee kann das ersetzen.' },
      { key: 'ug_fridge', text: 'Ich habe aktuell vier verschiedene Käsesorten, einen verdächtig alten Joghurt den ich schon zweimal fast weggeschmissen habe aber irgendwie nicht, und einen Zettel an dem steht: "du bist gut genug".' },
      { key: 'eg_reception', text: 'Ich bin jemand der in Gesprächen öfter zuhört als redet — und dann zu viel sagt genau wenn es unpassend ist.' },
      { key: 'og1_desk', text: 'Eine kleine Origami-Krabbe die mein Vater mal gefaltet hat als ich zwölf war. Ich weiß nicht mehr genau warum ich sie behalten habe aber ich würde in Panik geraten wenn ich sie verlöre.' },
      { key: 'og1_printer', text: 'Ich habe einmal die falsche Person in einem Thread getaggt und für drei Minuten dachte ich meine Karriere ist vorbei. Sie war nicht vorbei. Aber drei Minuten lang war ich komplett sicher dass das Ende war.' },
      { key: 'og1_window', text: 'Ich denke: "Was würde passieren wenn ich einfach heute nicht wiederkomme?" Nicht aus Unzufriedenheit — eher aus Neugier. Wie lange würde es dauern bis jemand fragt.' },
    ]
  },
  {
    name: 'Tom Lindner',
    email: 'tom@buena.com',
    level: 2,
    weirdness: 80,
    answers: [
      { key: 'ug_coffee', text: 'Ich brauche keinen Kaffee. Ich brauche das Ritual des Kaffees. Den Geruch. Dass jemand fragt ob ich einen will.' },
      { key: 'ug_fridge', text: 'Zu viele Soßen. Ich kaufe Soßen impulsiv und bereue sie nie, aber ich benutze sie auch fast nie.' },
      { key: 'eg_reception', text: 'Ich bin der Typ der bei Teamevents immer zuerst fragt ob alle was zu trinken haben. Das ist sowohl Fürsorge als auch eine Strategie um kurz rauszukommen.' },
      { key: 'og1_desk', text: 'Ein Post-it mit "WARUM?" — ich habe keine Erinnerung daran es geschrieben zu haben aber es ist seit Monaten da und ich traue mich nicht es wegzuschmeißen.' },
    ]
  },
]

async function seed() {
  console.log('🌱 Erstelle Test-Bichos...\n')

  for (const player of PLAYERS) {
    const h = hash(player.name)
    const appearance = {
      bicho_color: COLORS[h % COLORS.length],
      bicho_shape: SHAPES[(h >> 2) % SHAPES.length],
      bicho_eyes: EYES[(h >> 4) % EYES.length],
    }

    const { data: bicho, error } = await supabase
      .from('bichos')
      .upsert({
        name: player.name,
        email: player.email,
        ...appearance,
        current_level: player.level,
        weirdness_score: player.weirdness,
      }, { onConflict: 'email' })
      .select()
      .single()

    if (error) {
      console.error(`❌ ${player.name}:`, error.message)
      continue
    }

    // Insert answers
    for (const answer of player.answers) {
      await supabase.from('answers').upsert({
        bicho_id: bicho.id,
        level: player.level,
        question_key: answer.key,
        answer_text: answer.text,
      }, { onConflict: 'bicho_id,question_key' })
    }

    console.log(`✓ ${player.name} — Level ${player.level} · ⚡${player.weirdness} · ${player.answers.length} Antworten`)
  }

  console.log('\n✅ Fertig! Öffne http://localhost:3001 und melde dich mit einer der folgenden Emails an:\n')
  for (const p of PLAYERS) {
    console.log(`  ${p.email}  (${p.name})`)
  }
}

seed()
