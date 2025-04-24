import { Router } from 'express';
import { createTrip, getTrips, getTrip, updateTrip, deleteTrip } from '../controllers/trip.controller.js';
import authMiddleware from '../middlewares/verifyToken.js';

const router = Router();

router.post('/', authMiddleware, createTrip);
router.get('/', authMiddleware, getTrips);
router.get('/:id', authMiddleware, getTrip);
router.put('/:id', authMiddleware, updateTrip);
router.delete('/:id', authMiddleware, deleteTrip);

export default router;