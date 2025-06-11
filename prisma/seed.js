import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.memory.deleteMany();
  await prisma.person.deleteMany();

  const now = new Date();

  // Create 5 new people with all fields
  const peopleData = [
    { name: 'Alice Example', relationship: 'Friend', createdAt: now, updatedAt: now },
    { name: 'Bob Example', relationship: 'Colleague', createdAt: now, updatedAt: now },
    { name: 'Carol Example', relationship: 'Family', createdAt: now, updatedAt: now },
    { name: 'David Example', relationship: 'Neighbor', createdAt: now, updatedAt: now },
    { name: 'Eve Example', relationship: 'Partner', createdAt: now, updatedAt: now },
  ];
  const people = await Promise.all(
    peopleData.map(person => prisma.person.create({ data: person }))
  );

  // Helper to get random people for a memory
  function getRandomPeople() {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 people
    const shuffled = people.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(p => ({ id: p.id }));
  }

  // Create 30 memories with all properties and people
  for (let i = 1; i <= 30; i++) {
    const date = new Date(now.getTime() - i * 86400000); // i days ago
    const memory = await prisma.memory.create({
      data: {
        title: `Memory #${i}`,
        date: date.toISOString(),
        description: `This is a description for memory #${i}. It is a complete and realistic memory entry for testing purposes.`,
        photoUrl: 'https://placehold.co/600x400.png',
        createdAt: date,
        updatedAt: date,
        people: {
          connect: getRandomPeople(),
        },
      },
    });
    console.log(`Created memory ${memory.title}`);
  }

  console.log('Seeded 5 people and 30 complete memories!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 