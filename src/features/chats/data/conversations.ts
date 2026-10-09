import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(987654321)

export const conversations = Array.from({ length: 10 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const fullName = `${firstName} ${lastName}`
  const username = faker.internet
    .username({ firstName, lastName })
    .toLocaleLowerCase()
  const title = faker.person.jobTitle()
  const gender = faker.helpers.arrayElement(['men', 'women'])
  const portraitId = faker.number.int({ min: 1, max: 99 })
  const profile = `https://randomuser.me/api/portraits/${gender}/${portraitId}.jpg`

  const messageCount = faker.number.int({ min: 2, max: 15 })
  // Messages are stored newest-first (reverse chronological), matching the
  // original fixture so `messages[0]` is always the latest message.
  const messages = Array.from({ length: messageCount }, (_, i) => {
    const sender = i % 2 === 0 ? 'You' : fullName.split(' ')[0]
    return {
      sender,
      message: faker.lorem.sentence({ min: 5, max: 20 }),
      timestamp: faker.date.past({ years: 1 }),
    }
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return {
    id: `conv${faker.number.int({ min: 1, max: 999 })}`,
    profile,
    username,
    fullName,
    title,
    messages,
  }
})