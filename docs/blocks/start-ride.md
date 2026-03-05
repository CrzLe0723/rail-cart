# start rail ride

Starts a rail cart ride from one tile to another.

---

## What this block does

When this block runs, the rail cart:

- Moves from the start tile to the destination tile
- Locks the rider onto the cart
- Applies speed and easing settings
- Triggers ride events

---

## Requirements

Before using this block:

- A tilemap must be loaded
- A cart sprite must exist
- Both tiles must be valid tile locations

---

## Example

```blocks
namespace SpriteKind {
    export const cart = SpriteKind.create()
}
scene.setBackgroundColor(9)
tiles.setCurrentTilemap(tilemap`level1`)
let passenger = sprites.create(img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . b 5 5 b . . . 
    . . . . . . b b b b b b . . . . 
    . . . . . b b 5 5 5 5 5 b . . . 
    . b b b b b 5 5 5 5 5 5 5 b . . 
    . b d 5 b 5 5 5 5 5 5 5 5 b . . 
    . . b 5 5 b 5 d 1 f 5 d 4 f . . 
    . . b d 5 5 b 1 f f 5 4 4 c . . 
    b b d b 5 5 5 d f b 4 4 4 4 b . 
    b d d c d 5 5 b 5 4 4 4 4 4 4 b 
    c d d d c c b 5 5 5 5 5 5 5 b . 
    c b d d d d d 5 5 5 5 5 5 5 b . 
    . c d d d d d d 5 5 5 5 5 d b . 
    . . c b d d d d d 5 5 5 b b . . 
    . . . c c c c c c c c b b . . . 
    `, SpriteKind.Player)
passenger.setPosition(80, 52)
let Cart = sprites.create(img`
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    . . . . . . . . . . . . . . . . 
    c c c c c c c c c c c c c c c c 
    c b b b b b b b b b b b b b b c 
    c b b b b b b b b b b b b b b c 
    c b b b b b b b b b b b b b b c 
    c b b b b b b b b b b b b b b c 
    c b b b b b b b b b b b b b b c 
    c c c c c c c c c c c c c c c c 
    . . f f f . . . . . . f f f . . 
    `, SpriteKind.cart)
Cart.setPosition(80, 56)
railCart.startRide(
passenger,
Cart,
tiles.getTileLocation(2, 3),
tiles.getTileLocation(9, 3)
)

