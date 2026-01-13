require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(require('./middlewares/logger'));
app.use(express.json());

// Routes
app.use('/roomtypes', require('./routes/roomTypes'));
app.use('/rooms', require('./routes/rooms'));
app.use('/customers', require('./routes/customers'));
app.use('/bookings', require('./routes/bookings'));
app.use('/payments', require('./routes/payments'));
app.use('/reviews', require('./routes/reviews'));
app.use('/auth', require('./routes/auth'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(express.json());

// In-memory stores (simple beginner-friendly implementation)
const db = {
  roomTypes: [],
  rooms: [],
  customers: [],
  bookings: [],
  room_bookings: [], // { bookingId, roomId }
  payments: [],
  reviews: [],
};

let nextId = (arr) => (arr.length ? Math.max(...arr.map((r) => r.id)) + 1 : 1);

// Helpers
const find = (collection, id) => collection.find((i) => i.id === Number(id));

// --- RoomTypes ---
app.get('/roomtypes', (req, res) => res.json(db.roomTypes));
app.get('/roomtypes/:id', (req, res) => {
  const rt = find(db.roomTypes, req.params.id);
  if (!rt) return res.status(404).json({ error: 'RoomType not found' });
  res.json(rt);
});
app.post('/roomtypes', (req, res) => {
  const { name, description } = req.body;
  const item = { id: nextId(db.roomTypes), name, description };
  db.roomTypes.push(item);
  res.status(201).json(item);
});
app.put('/roomtypes/:id', (req, res) => {
  const rt = find(db.roomTypes, req.params.id);
  if (!rt) return res.status(404).json({ error: 'RoomType not found' });
  Object.assign(rt, req.body);
  res.json(rt);
});
app.delete('/roomtypes/:id', (req, res) => {
  const idx = db.roomTypes.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'RoomType not found' });
  db.roomTypes.splice(idx, 1);
  res.status(204).end();
});
app.get('/roomtypes/:id/rooms', (req, res) => {
  const rooms = db.rooms.filter((r) => r.roomTypeId === Number(req.params.id));
  res.json(rooms);
});

// --- Rooms ---
app.get('/rooms', (req, res) => res.json(db.rooms));
app.get('/rooms/:id', (req, res) => {
  const room = find(db.rooms, req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const roomType = find(db.roomTypes, room.roomTypeId) || null;
  res.json({ ...room, roomType });
});
app.post('/rooms', (req, res) => {
  const { number, roomTypeId, description } = req.body;
  const item = { id: nextId(db.rooms), number, roomTypeId: Number(roomTypeId), description };
  db.rooms.push(item);
  res.status(201).json(item);
});
app.put('/rooms/:id', (req, res) => {
  const room = find(db.rooms, req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  Object.assign(room, req.body);
  res.json(room);
});
app.delete('/rooms/:id', (req, res) => {
  const idx = db.rooms.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Room not found' });
  db.rooms.splice(idx, 1);
  // Remove any room_bookings that reference this room
  db.room_bookings = db.room_bookings.filter((rb) => rb.roomId !== Number(req.params.id));
  res.status(204).end();
});
app.get('/rooms/:id/reviews', (req, res) => {
  const reviews = db.reviews.filter((rv) => rv.roomId === Number(req.params.id)).map((rv) => ({
    ...rv,
    customer: find(db.customers, rv.customerId) || null,
  }));
  res.json(reviews);
});
app.get('/rooms/:id/bookings', (req, res) => {
  const bookingIds = db.room_bookings.filter((rb) => rb.roomId === Number(req.params.id)).map((rb) => rb.bookingId);
  const bookings = db.bookings.filter((b) => bookingIds.includes(b.id)).map((b) => ({
    ...b,
    customer: find(db.customers, b.customerId) || null,
  }));
  res.json(bookings);
});

// --- Customers ---
app.get('/customers', (req, res) => res.json(db.customers));
app.get('/customers/:id', (req, res) => {
  const c = find(db.customers, req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  res.json(c);
});
app.post('/customers', (req, res) => {
  const { name, email } = req.body;
  const item = { id: nextId(db.customers), name, email };
  db.customers.push(item);
  res.status(201).json(item);
});
app.put('/customers/:id', (req, res) => {
  const c = find(db.customers, req.params.id);
  if (!c) return res.status(404).json({ error: 'Customer not found' });
  Object.assign(c, req.body);
  res.json(c);
});
app.delete('/customers/:id', (req, res) => {
  const idx = db.customers.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Customer not found' });
  db.customers.splice(idx, 1);
  res.status(204).end();
});
app.get('/customers/:id/bookings', (req, res) => {
  const bookings = db.bookings.filter((b) => b.customerId === Number(req.params.id)).map((b) => ({
    ...b,
    rooms: db.room_bookings.filter((rb) => rb.bookingId === b.id).map((rb) => find(db.rooms, rb.roomId)),
  }));
  res.json(bookings);
});
app.get('/customers/:id/reviews', (req, res) => {
  const reviews = db.reviews.filter((rv) => rv.customerId === Number(req.params.id)).map((rv) => ({
    ...rv,
    room: find(db.rooms, rv.roomId) || null,
  }));
  res.json(reviews);
});

// --- Room_Bookings ---
app.post('/bookings/:bookingId/rooms/:roomId', (req, res) => {
  const booking = find(db.bookings, req.params.bookingId);
  const room = find(db.rooms, req.params.roomId);
  if (!booking || !room) return res.status(404).json({ error: 'Booking or Room not found' });
  const exists = db.room_bookings.find((rb) => rb.bookingId === booking.id && rb.roomId === room.id);
  if (exists) return res.status(400).json({ error: 'Room already assigned to booking' });
  db.room_bookings.push({ bookingId: booking.id, roomId: room.id });
  res.status(201).json({ bookingId: booking.id, roomId: room.id });
});
app.delete('/bookings/:bookingId/rooms/:roomId', (req, res) => {
  const before = db.room_bookings.length;
  db.room_bookings = db.room_bookings.filter((rb) => !(rb.bookingId === Number(req.params.bookingId) && rb.roomId === Number(req.params.roomId)));
  if (db.room_bookings.length === before) return res.status(404).json({ error: 'Assignment not found' });
  res.status(204).end();
});

// --- Bookings ---
app.get('/bookings', (req, res) => res.json(db.bookings));
app.get('/bookings/:id', (req, res) => {
  const b = find(db.bookings, req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  const customer = find(db.customers, b.customerId) || null;
  const rooms = db.room_bookings.filter((rb) => rb.bookingId === b.id).map((rb) => find(db.rooms, rb.roomId));
  res.json({ ...b, customer, rooms });
});
app.post('/bookings', (req, res) => {
  const { customerId, startDate, endDate, roomIds = [] } = req.body;
  const booking = { id: nextId(db.bookings), customerId: Number(customerId), startDate, endDate };
  db.bookings.push(booking);
  // assign rooms
  roomIds.forEach((roomId) => db.room_bookings.push({ bookingId: booking.id, roomId: Number(roomId) }));
  res.status(201).json(booking);
});
app.put('/bookings/:id', (req, res) => {
  const b = find(db.bookings, req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  const { startDate, endDate, roomIds } = req.body;
  if (startDate) b.startDate = startDate;
  if (endDate) b.endDate = endDate;
  if (Array.isArray(roomIds)) {
    // remove existing room_bookings for this booking
    db.room_bookings = db.room_bookings.filter((rb) => rb.bookingId !== b.id);
    roomIds.forEach((roomId) => db.room_bookings.push({ bookingId: b.id, roomId: Number(roomId) }));
  }
  res.json(b);
});
app.delete('/bookings/:id', (req, res) => {
  const idx = db.bookings.findIndex((b) => b.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Booking not found' });
  db.bookings.splice(idx, 1);
  db.room_bookings = db.room_bookings.filter((rb) => rb.bookingId !== Number(req.params.id));
  res.status(204).end();
});

// --- Payments ---
app.get('/payments', (req, res) => res.json(db.payments));
app.get('/payments/:id', (req, res) => {
  const p = find(db.payments, req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  res.json(p);
});
app.post('/bookings/:bookingId/payment', (req, res) => {
  const booking = find(db.bookings, req.params.bookingId);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  const { amount, method } = req.body;
  const payment = { id: nextId(db.payments), bookingId: booking.id, amount, method, date: new Date().toISOString() };
  db.payments.push(payment);
  res.status(201).json(payment);
});
app.get('/payments/:id/booking', (req, res) => {
  const p = find(db.payments, req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found' });
  const booking = find(db.bookings, p.bookingId) || null;
  const customer = booking ? find(db.customers, booking.customerId) : null;
  res.json({ payment: p, booking, customer });
});

// --- Reviews ---
app.get('/reviews', (req, res) => res.json(db.reviews));
app.get('/reviews/:id', (req, res) => {
  const r = find(db.reviews, req.params.id);
  if (!r) return res.status(404).json({ error: 'Review not found' });
  res.json({ ...r, room: find(db.rooms, r.roomId) || null, customer: find(db.customers, r.customerId) || null });
});
app.post('/rooms/:roomId/reviews', (req, res) => {
  const room = find(db.rooms, req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const { customerId, rating, comment } = req.body;
  const customer = find(db.customers, customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });
  const review = { id: nextId(db.reviews), roomId: room.id, customerId: customer.id, rating, comment, date: new Date().toISOString() };
  db.reviews.push(review);
  res.status(201).json(review);
});
app.put('/reviews/:id', (req, res) => {
  const r = find(db.reviews, req.params.id);
  if (!r) return res.status(404).json({ error: 'Review not found' });
  Object.assign(r, req.body);
  res.json(r);
});
app.delete('/reviews/:id', (req, res) => {
  const idx = db.reviews.findIndex((r) => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Review not found' });
  db.reviews.splice(idx, 1);
  res.status(204).end();
});
app.get('/rooms/:roomId/reviews', (req, res) => {
  const reviews = db.reviews.filter((rv) => rv.roomId === Number(req.params.roomId)).map((rv) => ({
    ...rv,
    customer: find(db.customers, rv.customerId) || null,
  }));
  res.json(reviews);
});
app.get('/customers/:customerId/reviews', (req, res) => {
  const reviews = db.reviews.filter((rv) => rv.customerId === Number(req.params.customerId)).map((rv) => ({
    ...rv,
    room: find(db.rooms, rv.roomId) || null,
  }));
  res.json(reviews);
});

// Basic error-handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
