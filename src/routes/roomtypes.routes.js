const router = require('express').Router();
const c = require('../controllers/roomtypes.controller');

router.get('/', c.getAll);
router.get('/:id', c.getOne);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);

/* JOIN */
router.get('/:id/rooms', c.getRoomsByType);

module.exports = router;
