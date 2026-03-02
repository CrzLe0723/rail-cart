 


> Open this page at [https://crzle0723.github.io/rail-cart/](https://crzle0723.github.io/rail-cart/)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://arcade.makecode.com/](https://arcade.makecode.com/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/crzle0723/rail-cart** and import

## Edit this project

To edit this repository in MakeCode.

* open [https://arcade.makecode.com/](https://arcade.makecode.com/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/crzle0723/rail-cart** and click import

#### Metadata (used for search, rendering)

* for PXT/arcade
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>

# Rail Cart Extension for MakeCode Arcade

Handle tile-based rail cart rides in your MakeCode Arcade games.  
Supports easing, passengers, events, sounds, effects, and advanced controls.

---

## Installation

1. Open your MakeCode Arcade project.
2. Click **Extensions** in the gear menu.
3. Search for `rail-cart` and add it.

---

## Blocks Overview

### Setup
- **set cart base speed $speed boost $boost** – Set base and boost speed.  
- **set easing type $type** – Choose acceleration/deceleration curve.  
- **set cart sound %sound** – Set a sound to play with the cart.  
- **follow cart with camera** – Make the camera follow the cart.

### Ride
- **start rail ride rider %rider cart %cartSprite from %from to %to** – Start a ride.  
- **add passenger %p** – Add extra sprites riding the cart.  
- **pause ride / resume ride / stop cart immediately** – Control the ride.  
- **change ride destination to %to** – Change the cart's destination mid-ride.

### Events
- **on ride start %handler** – Run code when ride begins.  
- **on ride progress %percent %handler** – Run code at certain progress points.  
- **on ride finished %handler** – Run code when ride ends.

### Effects
- **shake cart for %duration ms** – Shake the cart.  
- **set trail effect %effect with vx %vx vy %vy for %time attach to sprite %onSprite** – Particle effects.

### Utilities
- **ride progress percent** – Get progress of the ride.  
- **time remaining on cart ride (ms)** – Estimated remaining time.  
- **current cart speed** – Get the current speed.  
- **reverse cart direction** – Reverse movement.

### Advanced
- **force cart velocity vx %vx vy %vy** – Override movement.  
- **restore normal cart movement** – Return to default easing.  
- **disable / enable easing** – Temporarily control easing.  
- **teleport cart to x %x y %y** – Move the cart instantly.  
- **raw velocity override active** – Check if override is on.

---

## Example

```ts
let cart = sprites.create(img`
    . . . . 
`, SpriteKind.Player)
tiles.placeOnTile(cart, tiles.getTileLocation(2, 3))

railCart.setSpeed(0.8, 5.5)
railCart.startRide(player, cart, tiles.getTileLocation(2,3), tiles.getTileLocation(10,5))
railCart.onRideStart(() => {
    game.showLongText("Ride has started!", DialogLayout.Top)
})
