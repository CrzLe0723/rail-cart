# Ride Blocks

Ride blocks control how a rail cart moves along the map.
They are used to start, pause, resume, and stop cart rides.

Use these blocks to create:
- Minecart systems
- Cutscene-style movement
- Automatic travel between areas

---

## Ride control blocks

### [start rail ride](blocks/start-ride.md)

Starts a rail cart ride from one tile to another.

Use this block to begin any cart movement.
It locks the rider to the cart and triggers ride events.

---

### [pause ride](blocks/pause-ride.md)

Temporarily pauses the cart mid-ride.

Useful for:
- Dialogue
- Timed events
- Waiting for player input

---

### [resume ride](blocks/resume-ride.md)

Resumes a paused ride.

---

### [stop cart immediately](blocks/stop-ride.md)

Stops the cart and unlocks the rider immediately.

---

## Related event blocks

These blocks let you run code automatically during a ride.

- 🟢 [on rail ride start](blocks/on-ride-start.md)
- 📊 [on rail ride progress](blocks/on-ride-progress.md)
- 🏁 [on rail ride finished](blocks/on-ride-finish.md)
