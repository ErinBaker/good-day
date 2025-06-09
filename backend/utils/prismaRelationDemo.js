const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function main() {
  try {
    // Create a Person
    const person = await prisma.person.create({
      data: {
        name: 'Bob Relation',
        relationship: 'Colleague',
      },
    });
    // Create a Memory
    const memory = await prisma.memory.create({
      data: {
        title: 'Conference 2024',
        date: new Date('2024-05-01'),
        description: 'Attended a tech conference.',
        photoUrl: 'https://example.com/conference.jpg',
      },
    });
    // Link Person to Memory via MemoryPerson
    const memoryPerson = await prisma.memoryPerson.create({
      data: {
        memoryId: memory.id,
        personId: person.id,
      },
    });
    console.log('Linked Person to Memory:', memoryPerson);

    // Query: Get all People for a Memory
    const memoryWithPeople = await prisma.memory.findUnique({
      where: { id: memory.id },
      include: {
        people: {
          include: { person: true },
        },
      },
    });
    console.log('Memory with People:', memoryWithPeople);

    // Query: Get all Memories for a Person
    const personWithMemories = await prisma.person.findUnique({
      where: { id: person.id },
      include: {
        memories: {
          include: { memory: true },
        },
      },
    });
    console.log('Person with Memories:', personWithMemories);

    // Cascade delete: Delete the Person, check MemoryPerson is deleted
    await prisma.person.delete({ where: { id: person.id } });
    const orphanedLinks = await prisma.memoryPerson.findMany({ where: { personId: person.id } });
    console.log('Orphaned MemoryPerson links after deleting person (should be []):', orphanedLinks);

    // Clean up: Delete the Memory
    await prisma.memory.delete({ where: { id: memory.id } });
  } catch (error) {
    console.error('Relation demo error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 