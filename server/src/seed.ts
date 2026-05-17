import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import User from './models/User';
import Board from './models/Board';

const AVATAR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function makeStroke(tool: 'pen' | 'rect' | 'circle', userId: string, overrides: any = {}) {
  const base = {
    id: nanoid(),
    tool,
    color: overrides.color || '#FFFFFF',
    strokeWidth: 3,
    userId,
    timestamp: Date.now(),
    ...overrides,
  };
  if (tool === 'pen') {
    base.points = overrides.points || [
      { x: 100, y: 100 }, { x: 150, y: 120 }, { x: 200, y: 110 }, { x: 250, y: 140 },
    ];
  } else if (tool === 'rect') {
    base.points = overrides.points || [{ x: 300, y: 200 }, { x: 500, y: 320 }];
  } else if (tool === 'circle') {
    base.points = overrides.points || [{ x: 400, y: 400 }, { x: 480, y: 420 }];
  }
  return base;
}

function makeSticky(text: string, x: number, y: number, color: string, userId: string) {
  return {
    id: nanoid(),
    text,
    x,
    y,
    width: 200,
    height: 160,
    color,
    userId,
    timestamp: Date.now(),
  };
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Board.deleteMany({});
  console.log('Cleared users and boards');

  const demo = await User.create({
    name: 'Demo User',
    email: 'demo@whiteboard.app',
    password: 'Demo123!',
    avatar: randomColor(),
  });

  const collab = await User.create({
    name: 'Collab User',
    email: 'collab@whiteboard.app',
    password: 'Collab123!',
    avatar: randomColor(),
  });

  const demoId = String(demo._id);

  const boards = [
    {
      title: 'Product Roadmap Q1',
      description: 'Q1 initiatives and milestones',
      strokes: [
        makeStroke('rect', demoId, { color: '#6366F1', points: [{ x: 100, y: 100 }, { x: 300, y: 180 }] }),
        makeStroke('rect', demoId, { color: '#10B981', points: [{ x: 100, y: 220 }, { x: 300, y: 300 }] }),
        makeStroke('pen', demoId, { color: '#FFFFFF' }),
        makeStroke('circle', demoId, { color: '#F59E0B' }),
        makeStroke('pen', demoId, { color: '#EC4899', points: [{ x: 350, y: 150 }, { x: 400, y: 170 }, { x: 450, y: 160 }] }),
      ],
      stickyNotes: [
        makeSticky('Ship auth v2', 520, 120, '#FEF9C3', demoId),
        makeSticky('Onboarding flow redesign', 520, 300, '#DCFCE7', demoId),
        makeSticky('Mobile app beta', 750, 120, '#FCE7F3', demoId),
      ],
    },
    {
      title: 'Team Brainstorm Session',
      description: 'Ideas from the sync',
      strokes: [
        makeStroke('pen', demoId, { color: '#FFFFFF' }),
        makeStroke('pen', demoId, { color: '#3B82F6', points: [{ x: 100, y: 300 }, { x: 200, y: 320 }, { x: 300, y: 310 }] }),
        makeStroke('rect', demoId, { color: '#8B5CF6', points: [{ x: 400, y: 100 }, { x: 600, y: 200 }] }),
        makeStroke('circle', demoId, { color: '#10B981' }),
        makeStroke('pen', demoId, { color: '#EF4444' }),
        makeStroke('rect', demoId, { color: '#F59E0B', points: [{ x: 100, y: 400 }, { x: 280, y: 480 }] }),
      ],
      stickyNotes: [
        makeSticky('What if we added AI?', 650, 250, '#FEF9C3', demoId),
        makeSticky('Users love speed', 650, 420, '#DBEAFE', demoId),
        makeSticky('Ship weekly', 850, 250, '#E9D5FF', demoId),
        makeSticky('Cut scope', 850, 420, '#FED7AA', demoId),
      ],
    },
    {
      title: 'Login Flow Design',
      description: 'Auth UX revamp',
      strokes: [
        makeStroke('rect', demoId, { color: '#FFFFFF', points: [{ x: 200, y: 100 }, { x: 400, y: 180 }] }),
        makeStroke('rect', demoId, { color: '#FFFFFF', points: [{ x: 200, y: 220 }, { x: 400, y: 300 }] }),
        makeStroke('circle', demoId, { color: '#6366F1' }),
        makeStroke('pen', demoId, { color: '#FFFFFF', points: [{ x: 500, y: 150 }, { x: 600, y: 160 }, { x: 700, y: 155 }] }),
        makeStroke('rect', demoId, { color: '#10B981', points: [{ x: 500, y: 350 }, { x: 700, y: 430 }] }),
      ],
      stickyNotes: [
        makeSticky('Google OAuth', 450, 120, '#DBEAFE', demoId),
        makeSticky('Magic link fallback', 450, 300, '#DCFCE7', demoId),
        makeSticky('Remember me toggle', 750, 120, '#FEF9C3', demoId),
      ],
    },
  ];

  for (const b of boards) {
    await Board.create({
      ...b,
      owner: demo._id,
      collaborators: [{ user: collab._id, role: 'editor' }],
    });
  }

  console.log('✅ Seeding complete');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
