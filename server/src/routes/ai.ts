import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import openai from '../lib/openai';
import Board from '../models/Board';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

const diagramSchema = z.object({
  prompt: z.string().min(3, 'Prompt too short').max(500, 'Prompt too long'),
  boardId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: 'Invalid boardId',
  }),
});

const DIAGRAM_SYSTEM_PROMPT = `You are a diagram generator for a whiteboard app. The user describes a flow or process. Return ONLY a JSON object with this exact shape:
{
  "shapes": [{ "id": string, "type": "rect"|"diamond"|"circle", "x": number, "y": number, "width": number, "height": number, "label": string (max 4 words), "color": string (hex), "borderColor": string (hex) }],
  "connections": [{ "from": string (shape id), "to": string (shape id), "label": string (optional, max 2 words) }]
}
Layout rules:
- Start at x=300, y=100
- Each subsequent node y+=140
- Decision diamonds branch: Yes path x-=200, No path x+=200
- Max 10 shapes
- All shape IDs are unique
- Default color: "#FFFFFF", default borderColor: "#6366F1"
- Success states: green #10B981 border; error states: red #EF4444 border; decisions: yellow #F59E0B border
Return ONLY the JSON object. No preamble, no markdown fences.`;

router.post('/diagram', async (req: Request, res: Response) => {
  const parsed = diagramSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { prompt } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: DIAGRAM_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    let parsedJson: { shapes?: unknown; connections?: unknown };
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid format' });
    }
    if (!Array.isArray(parsedJson.shapes)) {
      return res.status(502).json({ error: 'AI returned invalid format' });
    }
    return res.json({
      shapes: parsedJson.shapes,
      connections: Array.isArray(parsedJson.connections) ? parsedJson.connections : [],
      generationId: nanoid(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.message.toLowerCase().includes('rate')
        ? 'AI rate limit reached. Please try again in a moment.'
        : 'AI service unavailable. Please try again.';
    return res.status(502).json({ error: message });
  }
});

// ---- Summarise ----
const summariseSchema = z.object({
  boardId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: 'Invalid boardId',
  }),
});

router.post('/summarise', async (req: Request, res: Response) => {
  const parsed = summariseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { boardId } = parsed.data;

  const board = await Board.findById(boardId);
  if (!board) return res.status(404).json({ error: 'Not found' });

  const stickyTexts = (board.stickyNotes || [])
    .map((n: { text?: string }) => n.text?.trim())
    .filter((t: string | undefined): t is string => !!t);
  const strokeTexts = (board.strokes || [])
    .filter((s: { tool?: string; text?: string }) => s.tool === 'text' && s.text?.trim())
    .map((s: { text?: string }) => (s.text || '').trim());
  const items = [...stickyTexts, ...strokeTexts];

  if (items.length < 3) {
    return res.json({ summary: null, reason: 'Not enough content' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a whiteboard analyst. Given the text content from a collaborative whiteboard, write a 3-4 sentence plain English summary of what this board is about and what the team is working on. Be specific about topics. Professional tone.',
        },
        { role: 'user', content: 'Board content:\n' + items.join('\n') },
      ],
    });
    const summary = completion.choices?.[0]?.message?.content?.trim() || '';
    return res.json({ summary });
  } catch {
    return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// ---- Organise ----
const organiseSchema = z.object({
  notes: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
      })
    )
    .min(2, 'At least 2 notes required'),
});

router.post('/organise', async (req: Request, res: Response) => {
  const parsed = organiseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { notes } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Group these sticky notes by theme. Return ONLY JSON: { "themes": [{ "name": string, "color": string (hex), "noteIds": string[] }] }. Max 4 themes. Use distinct background colors: #FEF9C3, #DCFCE7, #FCE7F3, #DBEAFE.',
        },
        { role: 'user', content: JSON.stringify(notes) },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    let parsedJson: { themes?: unknown };
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'AI returned invalid format' });
    }
    if (!Array.isArray(parsedJson.themes)) {
      return res.status(502).json({ error: 'AI returned invalid format' });
    }
    return res.json({ themes: parsedJson.themes });
  } catch {
    return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
});

// ---- OCR (vision) ----
const ocrSchema = z.object({
  imageBase64: z
    .string()
    .refine((v) => v.startsWith('data:image/png;base64,'), { message: 'Invalid image format' }),
  boardId: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: 'Invalid boardId',
  }),
});

router.post('/ocr', async (req: Request, res: Response) => {
  const parsed = ocrSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { imageBase64 } = parsed.data;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            {
              type: 'text',
              text: 'This is a region of a whiteboard. Read any handwritten text visible. Return ONLY the extracted text. If no text visible, return empty string. Do not add commentary or prefixes.',
            },
          ],
        },
      ],
    });
    const text = (completion.choices?.[0]?.message?.content || '').trim();
    return res.json({ text, confidence: 0.9 });
  } catch {
    return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
  }
});

export default router;
