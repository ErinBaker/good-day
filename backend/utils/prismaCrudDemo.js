const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    // CREATE a new Person
    const person = await prisma.person.create({
      data: {
        name: 'Alice Example',
        relationship: 'Friend',
      },
    });
    console.log('Created Person:', person);

    // CREATE a new Memory
    const memory = await prisma.memory.create({
      data: {
        title: 'A Day at the Park',
        date: new Date('2024-06-09'),
        description: 'Picnic and games with friends.',
        photoUrl: 'https://example.com/photo.jpg',
      },
    });
    console.log('Created Memory:', memory);

    // READ all People
    const people = await prisma.person.findMany();
    console.log('All People:', people);

    // READ all Memories
    const memories = await prisma.memory.findMany();
    console.log('All Memories:', memories);

    // UPDATE a Person
    const updatedPerson = await prisma.person.update({
      where: { id: person.id },
      data: { relationship: 'Best Friend' },
    });
    console.log('Updated Person:', updatedPerson);

    // DELETE the Memory
    await prisma.memory.delete({ where: { id: memory.id } });
    console.log('Deleted Memory with id:', memory.id);

    // DELETE the Person
    await prisma.person.delete({ where: { id: person.id } });
    console.log('Deleted Person with id:', person.id);
  } catch (error) {
    console.error('CRUD demo error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 