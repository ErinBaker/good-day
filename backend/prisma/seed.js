const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.memoryPerson.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.person.deleteMany();

  // Create People
  const alice = await prisma.person.create({
    data: { name: 'Alice Example', relationship: 'Friend' },
  });
  const bob = await prisma.person.create({
    data: { name: 'Bob Example', relationship: 'Colleague' },
  });
  const carol = await prisma.person.create({
    data: { name: 'Carol Example', relationship: 'Family' },
  });

  // Create Memories
  const picnic = await prisma.memory.create({
    data: {
      title: 'Picnic in the Park',
      date: new Date('2024-05-01'),
      description: 'A sunny day with friends and family.',
      photoUrl: 'https://example.com/picnic.jpg',
    },
  });
  const conference = await prisma.memory.create({
    data: {
      title: 'Tech Conference',
      date: new Date('2024-06-01'),
      description: 'Learned about new technologies.',
      photoUrl: 'https://example.com/conference.jpg',
    },
  });

  // Link People to Memories
  await prisma.memoryPerson.createMany({
    data: [
      { memoryId: picnic.id, personId: alice.id },
      { memoryId: picnic.id, personId: carol.id },
      { memoryId: conference.id, personId: bob.id },
      { memoryId: conference.id, personId: alice.id },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 