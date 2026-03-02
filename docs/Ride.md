# Ride Blocks

These blocks let you control the cart ride.

## start rail ride
**Block:** `start rail ride rider %rider cart %cartSprite from %from to %to`  
Starts a ride from one tile to another. Locks the player to the cart and moves it along a path.

## pause ride
Pauses the ride temporarily. Does not release passengers.

## resume ride
Resumes a paused ride.

## stop cart immediately
Stops the ride and releases the player.

## change ride destination
**Block:** `change ride destination to %to`  
Change the cart’s target tile mid-ride.

## is cart paused
Returns true if the ride is currently paused.

## has cart ride finished
Returns true if the ride is finished.
