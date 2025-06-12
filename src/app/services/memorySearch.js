import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Search memories with text, date range, people, pagination, and highlighting.
 * @param {Object} params
 * @param {string} params.text
 * @param {string} params.dateFrom
 * @param {string} params.dateTo
 * @param {string[]} params.peopleIds
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{items: Array<{memory: any, highlights: Array<any>}>, totalCount: number}>}
 */
export async function searchMemories({ text, dateFrom, dateTo, peopleIds, limit = 10, offset = 0 }) {
  const where = {};
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }
  if (peopleIds && peopleIds.length > 0) {
    where.people = {
      some: {
        id: { in: peopleIds }
      }
    };
  }
  if (text && text.trim() !== "") {
    where.OR = [
      { title: { contains: text, mode: 'insensitive' } },
      { description: { contains: text, mode: 'insensitive' } }
    ];
  }
  const [items, totalCount] = await Promise.all([
    prisma.memory.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
      include: { people: true, photos: true },
    }),
    prisma.memory.count({ where }),
  ]);
  // Highlight logic
  function getHighlights(memory, text) {
    if (!text || text.trim() === "") return [];
    const highlights = [];
    const lower = text.toLowerCase();
    ['title', 'description'].forEach(field => {
      const value = memory[field] || '';
      const valueLower = value.toLowerCase();
      let start = 0;
      while (start < value.length) {
        const idx = valueLower.indexOf(lower, start);
        if (idx === -1) break;
        highlights.push({
          field,
          value,
          indices: [[idx, idx + text.length]]
        });
        start = idx + text.length;
      }
    });
    return highlights;
  }
  const results = items.map(memory => ({
    memory,
    highlights: getHighlights(memory, text)
  }));
  return { items: results, totalCount };
} 