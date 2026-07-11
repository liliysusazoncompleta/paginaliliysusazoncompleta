import { Router } from 'express';
import { z } from 'zod';
import { sendContactEmail } from '../services/mailer.js';

export const contactRouter = Router();

contactRouter.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      nombre: z.string().trim().min(2).max(120),
      telefono: z.string().trim().min(7).max(30),
      correo: z.string().trim().email().optional().or(z.literal('')),
      mensaje: z.string().trim().min(3).max(2000),
    });

    const data = schema.parse(req.body);
    await sendContactEmail(data);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
