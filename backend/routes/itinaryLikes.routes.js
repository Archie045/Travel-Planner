import { Router } from 'express';
import { createItineraryLike, getItineraryLikes, updateItineraryLike, deleteItineraryLike } from '../controllers/itninaryLikes.controller.js';
import authMiddleware from '../middlewares/verifyToken.js';

const router = Router();

router.post('/', authMiddleware, createItineraryLike);
router.get('/', authMiddleware, getItineraryLikes);
router.put('/:id', authMiddleware, updateItineraryLike);
router.delete('/:id', authMiddleware, deleteItineraryLike);

export default router;