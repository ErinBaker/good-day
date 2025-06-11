const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.memoryPerson.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.person.deleteMany();

  const now = new Date();

  // Create 5 new people with all fields
  await prisma.person.createMany({
    data: [
      { name: 'Alice Example', relationship: 'Friend', createdAt: now, updatedAt: now },
      { name: 'Bob Example', relationship: 'Colleague', createdAt: now, updatedAt: now },
      { name: 'Carol Example', relationship: 'Family', createdAt: now, updatedAt: now },
      { name: 'David Example', relationship: 'Neighbor', createdAt: now, updatedAt: now },
      { name: 'Eve Example', relationship: 'Partner', createdAt: now, updatedAt: now },
    ]
  });

  console.log('Seeded 5 people with UUIDs and timestamps!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect()); 