import { Router } from 'express';
import { createItinerary, getItineraries, getItinerary, updateItinerary, deleteItinerary } from '../controllers/itinary.controller.js';
import authMiddleware from '../middlewares/verifyToken.js';

const router = Router();

router.post('/', authMiddleware, createItinerary);
router.get('/', authMiddleware, getItineraries);
router.get('/:id', authMiddleware, getItinerary);
router.put('/:id', authMiddleware, updateItinerary);
router.delete('/:id', authMiddleware, deleteItinerary);

export default router;