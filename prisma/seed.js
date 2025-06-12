import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.photo.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.person.deleteMany();

  // Create 5 people
  const now = new Date();
  const peopleData = [
    { name: 'Alice Example', relationship: 'Friend', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { name: 'Bob Example', relationship: 'Colleague', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { name: 'Carol Example', relationship: 'Family', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { name: 'David Example', relationship: 'Neighbor', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { name: 'Eve Example', relationship: 'Partner', createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ];
  peopleData.forEach(person => {
    console.log('Person:', {
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      createdAtType: typeof person.createdAt,
      updatedAtType: typeof person.updatedAt,
    });
  });
  const people = await Promise.all(
    peopleData.map(person => prisma.person.create({ data: person }))
  );

  // Helper to get random people for a memory
  function getRandomPeople() {
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 people
    const shuffled = [...people].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(p => ({ id: p.id }));
  }

  // Create 30 memories, each with a photo
  for (let i = 1; i <= 30; i++) {
    const date = new Date(now.getTime() - i * 86400000); // i days ago
    const isoDate = date.toISOString();
    const memoryData = {
      title: `Memory #${i}`,
      date: isoDate,
      description: `This is a description for memory #${i}. It is a complete and realistic memory entry for testing purposes.`,
      photoUrl: `https://placehold.co/600x400.png?text=Memory+${i}`,
      createdAt: isoDate,
      updatedAt: isoDate,
      people: { connect: getRandomPeople() },
    };
    console.log('Memory:', {
      date: memoryData.date,
      createdAt: memoryData.createdAt,
      updatedAt: memoryData.updatedAt,
      dateType: typeof memoryData.date,
      createdAtType: typeof memoryData.createdAt,
      updatedAtType: typeof memoryData.updatedAt,
    });
    const memory = await prisma.memory.create({ data: memoryData });
    const photoData = {
      originalFilename: `photo${i}.jpg`,
      folder: 'default',
      baseFilename: `photo${i}.jpg`,
      mimeType: 'image/jpeg',
      size: 123456,
      width: 600,
      height: 400,
      createdAt: isoDate,
      memoryId: memory.id,
    };
    console.log('Photo:', {
      createdAt: photoData.createdAt,
      createdAtType: typeof photoData.createdAt,
    });
    await prisma.photo.create({ data: photoData });
  }

  console.log('Seeded 5 people and 30 complete memories!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 