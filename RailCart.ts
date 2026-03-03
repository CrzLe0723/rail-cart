
//% weight=90 color=#444444 icon="\uf238" groups='["Ride","Setup","Events","Effects","Utilities","Audio","Passengers","Advanced"]'
namespace railCart {
    // --- Internal state ---
    let active = false
    let player: Sprite = null
    let cart: Sprite = null
    let start: tiles.Location = null
    let end: tiles.Location = null
    let totalDist = 0
    let baseSpeed = 0.8
    let boostSpeed = 5.5
    let progressEvents: { percent: number, handler: () => void, triggered: boolean }[] = []
    let onFinish: () => void = null
    let onStart: () => void = null
    let passengers: Sprite[] = []
    let effectType: any = null
    let activeCart: Sprite = null
    let easingEnabled = true
    let rawVelocityOverride = false
    let startTime = 0
    let estimatedDuration = 0
    let trailLoopEnabled = false
    let effectColor: number = 0
    // --- Easing options ---
    export enum EasingType {
        //% block="Sine"
        Sine,
        //% block="Linear"
        Linear,
        //% block="Cubic"
        Cubic,
        //% block="EaseIn"
        EaseIn,
        //% block="EaseOut"
        EaseOut,
        //% block="EaseInOut"
        EaseInOut,
        //% block="Quadratic"
        Quadratic
    }
    let easing: EasingType = EasingType.Sine

    // --- Effect Options ---
    export enum EffectType {
        //% block="Dust"
        Dust,
        //% block="Steam"
        Steam,
        //% block="Sparks"
        Sparks
    }

    // --- Direction Options ---
    export enum CartDirection {
        //% block="forward" weight=100
        Forward,
        //% block="backward" weight=90
        Backward
    }
    let direction: CartDirection = CartDirection.Forward
    
    // --- Setup Blocks ---

    /**
     * Set the base and boost speed for the cart
     */
    //% block="set cart base speed $speed boost $boost"
    //% group="Setup"
    //% speed.defl=0.8 boost.defl=5.5
    //% blockId=railcart_set_speed
    export function setSpeed(speed: number, boost: number) {
        baseSpeed = speed
        boostSpeed = boost
    }

    /**
     * Chooses how the cart accelerates/decelerates.
     */
    //% block="set easing type $type"
    //% group="Setup"
    //% blockId=railcart_set_easing
    export function setEasing(type: EasingType) {
        easing = type
    }

    /**
     * Returns true if the cart is currently moving
     */
    //% block="Is cart currently moving"
    //% group="Setup"
    //% blockId=railcart_is_active
    export function isActive(): boolean {
        return active
    }

    /**
     * Sets a sound for the cart
     */
    //% block="set cart sound %sound"
    //% group="Setup"
    //% blockId=railcart_set_sound
    export function setCartSound(sound: music.Playable) {
        music.play(sound, music.PlaybackMode.InBackground)
    }

    /**
     * Makes the camera follow the cart
     */
    //% block="follow cart with camera"
    //% group="Setup"
    //% blockId=railcart_follow_camera
    export function followCartCamera() { scene.cameraFollowSprite(cart) }


    // --- Ride Blocks ---
    /**
     * Starts a rail cart ride from one tile to another.
    */
    //% block="start rail ride rider %rider cart %cartSprite from %from to %to"
    //% group="Ride"
    //% blockId=railcart_start_ride
    export function startRide(rider: Sprite, cartSprite: Sprite, from: tiles.Location, to: tiles.Location) {
        if (active) return
        player = rider
        cart = cartSprite
        activeCart = cartSprite
        start = from
        end = to
        passengers = []

        let s = tileCenter(start)
        let e = tileCenter(end)

        cart.x = s.x
        cart.y = s.y
        cart.setFlag(SpriteFlag.GhostThroughWalls, true)

        // Lock player
        player.ay = 0
        controller.moveSprite(player, 0, 0)
        player.x = cart.x
        player.y = cart.y - 4

        totalDist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2)
        active = true
        startTime = game.runtime()
        estimatedDuration = totalDist / (baseSpeed + boostSpeed) * 16

        if (onStart) {
            onStart()
        }
    }

    /**
     * Temporarily stops the cart mid-ride.
     */
    //% block="pause ride"
    //% group="Ride"
    //% blockId=railcart_pause_ride
    export function pauseRide() { active = false }

    /**
     * Resumes the cart if paused.
     */
    //% block="resume ride"
    //% group="Ride"
    //% blockId=railcart_resume_ride
    export function resumeRide() { active = true }

    /**
     * Immediately stops the cart and unlocks the player.
     */
    //% block="stop cart immediately"
    //% group="Ride"
    //% blockId=railcart_stop_ride
    export function stopRide() { active = false }

    /**
     * Returns true if the ride has finished
     */
    //% block="has cart ride finished"
    //% group="Ride"
    //% blockId=railcart_has_finished
    export function hasRideFinished(): boolean {
        return !active
    }

    /**
     * Returns true if the ride is paused
     */
    //% block="is cart paused"
    //% group="Ride"
    //% blockId=railcart_is_paused
    export function isPaused(): boolean {
        return !active && player != null
    }
    /**
     * Change the destination to another location
     */
    //% block="change ride destination to %to"
    //% group="Ride"
    //% blockId=railcart_change_destination
    export function changeDestination(to: tiles.Location) { end = to }

    // --- Event Blocks ---

    /**
     * Run the code when the ride starts.
    */
    //% block="on ride start %handler"
    //% group="Events"
    //% @param handler.shadow="procedures_callnoreturn"
    //% blockId=railcart_on_ride_start
    export function onRideStart(handler: () => void) {
        onStart = handler
    }

    /**
     * Run the code when the ride finishes.
     */
    //% block="on ride finished %handler"
    //% group="Events"
    //% blockId=railcart_on_finish
    export function onRideFinish(handler: () => void) {
        onFinish = handler
    }

    /**
     * Runs the code when the ride progress reaches a certain point
     */
    //% block="on ride progress %percent %handler"
    //% group="Events"
    //% percent.defl=50
    //% blockId=railcart_on_progress
    export function onRideProgress(percent: number, handler: () => void) {
        progressEvents.push({ percent, handler, triggered: false })
    }

    /**
 * Run code when a passenger is added
 */
    //% block="on passenger added %handler"
    //% group="Events"
    //% blockId=railcart_on_passenger_added
    //% handler.shadow="procedures_callnoreturn"
    export function onPassengerAdded(handler: () => void) {
        passengerAddedHandler = handler
    }
    let passengerAddedHandler: () => void = null

    /**
     * Run code when the cart is paused
     */
    //% block="on cart paused %handler"
    //% group="Events"
    //% blockId=railcart_on_pause
    //% handler.shadow="procedures_callnoreturn"
    export function onCartPaused(handler: () => void) { pauseHandler = handler }
    let pauseHandler: () => void = null

    /**
     * Run code when the cart is resumed
     */
    //% block="on cart resumed %handler"
    //% group="Events"
    //% blockId=railcart_on_resume
    //% handler.shadow="procedures_callnoreturn"
    export function onCartResumed(handler: () => void) { resumeHandler = handler }
    let resumeHandler: () => void = null

    /**
     * Run code when cart reaches midpoint (50%)
     */
    //% block="on cart midpoint reached %handler"
    //% group="Events"
    //% blockId=railcart_on_midpoint
    //% handler.shadow="procedures_callnoreturn"
    export function onCartMidpoint(handler: () => void) {
        onRideProgress(50, handler)
    }

    // --- Helper ---
    function tileCenter(t: tiles.Location) {
        return { x: t.col * 16 + 8, y: t.row * 16 + 8 }
    }

    // --- Update Loop ---
    game.onUpdate(function () {
        if (!active) return

        let target = tileCenter(end)
        let dx = target.x - cart.x
        let dy = target.y - cart.y
        let dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 2) {
            finishRide()
            return
        }

        let angle = Math.atan2(dy, dx)
        let progress = (totalDist - dist) / totalDist
        progress = Math.min(Math.max(progress, 0), 1)

        let ease = 0
        switch (easing) {
            case EasingType.Sine: ease = Math.sin(progress * Math.PI); break
            case EasingType.Linear: ease = progress; break
            case EasingType.Cubic: ease = progress ** 3; break
            case EasingType.EaseIn: ease = progress ** 2; break
            case EasingType.EaseOut: ease = 1 - (1 - progress) ** 2; break
            case EasingType.EaseInOut: ease = progress < 0.5 ? 2 * progress ** 2 : 1 - 2 * (1 - progress) ** 2; break
            case EasingType.Quadratic: ease = progress ** 2; break
        }

        let step = baseSpeed + ease * boostSpeed
        cart.x += Math.cos(angle) * step
        cart.y += Math.sin(angle) * step

        // Move player
        player.x = cart.x
        player.y = cart.y - 4

        // Move passengers
        for (let p of passengers) {
            p.x = cart.x
            p.y = cart.y - 4
        }
        for (let e of progressEvents) {
            if (!e.triggered && progress >= e.percent / 100) {
                e.handler()
                e.triggered = true
            }
        }
    })

    function finishRide() {
        active = false
        tiles.placeOnTile(player, end)
        player.ay = 500
        controller.moveSprite(player, 75, 0)
        if (onFinish) onFinish()
    }

    // --- Effect Blocks ---

    /**
     * Shakes the cart for the specified duration
     */
    //% block="shake cart for %duration ms"
    //% group="Effects"
    //% duration.defl=500
    //% blockId=railcart_shake
    export function shakeCart(duration: number) {
        const originalX = cart.x
        const originalY = cart.y
        let elapsed = 0

        game.onUpdateInterval(50, function () {
            if (!active || elapsed >= duration) {
                cart.x = originalX
                cart.y = originalY
                return
            }
            cart.x = originalX + randint(-2, 2)
            cart.y = originalY + randint(-2, 2)
            elapsed += 50
        })
    }

    /**
    * Creates a trail effect (dust, sparks, steam) behind the cart.
    * @param eType The type of effect (Dust, Steam, Sparks)
    * @param vx x velocity of particles
    * @param vy y velocity of particles
    * @param time duration in ms
    * @param onSprite whether to attach the effect to a sprite (optional)
    * @param x set the x position of the effect (optional)
    * @param y set the y position of the effect (optional)
    */
    //% block="set trail effect %eType with vx %vx vy %vy for %time ms attach to sprite %onSprite"
    //% group="Effects"
    //% vx.defl=0 vy.defl=0 time.defl=1000 onSprite.defl=true
    //% expandableArgumentMode="toggle"
    //% blockId=railcart_trail_effect
    export function setTrailEffect(eType: EffectType, vx: number, vy: number, time: number, onSprite?: boolean, x?: number, y?: number) {
        if (!cart) return

        let fx: SpreadEffectData

        switch (eType) {
            case EffectType.Dust: fx = extraEffects.createCustomSpreadEffectData([11, 12], false, extraEffects.createPresetSizeTable(ExtraEffectPresetShape.Spark), extraEffects.createPercentageRange(50, 100), extraEffects.createPercentageRange(200, 400), extraEffects.createPercentageRange(200, 400), vx, vy); break

        }

        if (fx) {
            if (onSprite) {
                extraEffects.createSpreadEffectOnAnchor(cart, fx, time)
            } else {
                // Optionally, you could spawn the effect at cart.x/cart.y
                extraEffects.createSpreadEffectAt(fx, x, y, time)
            }
        }
    }

    /**
     * Clears any effects on the cart
    */
    //% block="clear any effect on cart"
    //% group="Effects"
    //% blockId=railcart_clear_effects
    export function clearEffects() {
        effects.clearParticles(cart)
    }

    /**
     * Set trail effect color (for Dust/Sparks/Steam)
     */
    //% block="set trail effect color $color"
    //% group="Effects"
    //% blockId=railcart_trail_color
    export function setTrailColor(color: number) {
        effectColor = color
    }

    /**
     * Make the trail effect loop continuously
     */
    //% block="loop trail effect $enabled"
    //% group="Effects"
    //% blockId=railcart_loop_effect
    export function loopTrailEffect(enabled: boolean) {
        trailLoopEnabled = enabled
    }
    
    // --- Utilities Blocks ---
    /**
     * Gets the cart's current speed
     */
    //% block="current cart speed"
    //% group="Utilities"
    //% blockId=railcart_get_speed
    export function getSpeed(): number { return baseSpeed + boostSpeed }

    /**
     * Reverses the cart's movement
     */
    //% block="reverse cart direction"
    //% group="Utilities"
    //% blockId=railcart_reverse
    export function reverseCart() { [start, end] = [end, start] }
    /**
     * Get the cart's position
     */
    //% block="cart position"
    //% group="Utilities"
    //% blockId=railcart_get_position
    export function cartPosition(): { x: number, y: number } {
        return { x: cart.x, y: cart.y }
    }

    /**
     * Get the tile the cart is on
     */
    //% block="cart is on tile"
    //% group="Utilities"
    //% blockId=railcart_get_tile
    export function getCartTile(): tiles.Location {
        return tiles.getTileLocation(Math.floor(cart.x / 16), Math.floor(cart.y / 16))
    }

    /**
     * Get the distance to the destination
     */
    //% block="distance to ride destination"
    //% group="Utilities"
    //% blockId=railcart_distance_to_end
    export function distanceToDestination(): number {
        if (!cart || !end) return 0
        let dx = tileCenter(end).x - cart.x
        let dy = tileCenter(end).y - cart.y
        return Math.sqrt(dx * dx + dy * dy)
    }
    /**
     * Gets the progress of the current rail ride in percent
    */
    //% block="ride progress percent"
    //% group="Utilities"
    //% blockId=railcart_get_progress
    export function getProgress(): number {
        if (!active || !cart || !start || !end) return 0

        // Compute distance from start to end
        let s = tileCenter(start)
        let e = tileCenter(end)

        let dx = e.x - cart.x
        let dy = e.y - cart.y
        let remainingDist = Math.sqrt(dx * dx + dy * dy)

        let totalDistance = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2)
        if (totalDistance <= 0) return 0

        let progress = (totalDistance - remainingDist) / totalDistance
        progress = Math.min(Math.max(progress, 0), 1)

        return Math.round(progress * 100) // return as percentage
    }

    /**
     * Returns the estimated remaining time of the ride in milliseconds.
     */
    //% block="time remaining on cart ride (ms)"
    //% group="Utilities"
    //% advanced=true
    //% blockId=railcart_time_remaining
    export function timeRemaining(): number {
        if (!active) return 0
        const elapsed = game.runtime() - startTime
        return Math.max(estimatedDuration - elapsed, 0)
    }

    // --- Direction Blocks ---

    /**
     * Set the cart's movement direction explicitly
     */
    //% block="set cart direction to $dir"
    //% group="Utilities"
    //% blockId=railcart_set_direction
    export function setDirection(dir: CartDirection) {
        if (!activeCart) return
        if (dir === CartDirection.Forward) {
            [start, end] = [start, end] // normal
        } else {
            [start, end] = [end, start] // reverse
        }
        direction = dir
    }

    /**
     * Returns the current cart direction
     */
    //% block="cart direction"
    //% group="Utilities"
    //% blockId=railcart_get_direction
    export function getDirection(): CartDirection {
        return direction
    }

    // --- Speed Helpers ---

    /**
     * Get the cart's base speed
     */
    //% block="cart base speed"
    //% group="Utilities"
    //% blockId=railcart_get_base_speed
    export function getBaseSpeed(): number { return baseSpeed }

    /**
     * Get the cart's boost speed
     */
    //% block="cart boost speed"
    //% group="Utilities"
    //% blockId=railcart_get_boost_speed
    export function getBoostSpeed(): number { return boostSpeed }

    /**
     * Temporarily boost the cart speed for a duration
     */
    //% block="boost cart by $amount for $duration ms"
    //% group="Utilities"
    //% blockId=railcart_temp_boost
    export function temporaryBoost(amount: number, duration: number) {
        baseSpeed += amount
        timer.after(duration, function () {
            baseSpeed -= amount
        })
    }

    // --- Advanced Blocks ---
    /**
        * Force the cart to move at a raw velocity, bypassing easing.
        * Use with care.
        * @param vx horizontal velocity
        * @param vy vertical velocity
    */
    //% block="force cart velocity vx $vx vy $vy"
    //% vx.defl=50 vy.defl=0
    //% group="Advanced"
    //% weight=100
    //% advanced=true
    //% blockId=railcart_force_velocity
    export function forceVelocity(vx: number, vy: number) {
        if (!activeCart) return
        rawVelocityOverride = true
        activeCart.vx = vx
        activeCart.vy = vy
    }

    /**
        * Restore normal cart movement and re-enable easing.
    */
    //% block="restore normal cart movement"
    //% group="Advanced"
    //% weight=95
    //% advanced=true
    //% blockId=railcart_restore_movement
    export function restoreMovement() {
        rawVelocityOverride = false
        easingEnabled = true
    }
    /**
        * Temporarily disable easing for sharp movement.
    */
    //% block="disable easing temporarily"
    //% group="Advanced"
    //% weight=90
    //% advanced=true
    //% blockId=railcart_disable_easing
    export function disableEasing() {
        easingEnabled = false
    }

    /**
        * Re-enable cart easing.
    */
    //% block="enable easing"
    //% group="Advanced"
    //% weight=85
    //% advanced=true
    //% blockId=railcart_enable_easing
    export function enableEasing() {
        easingEnabled = true
    }

    /**
     * Returns true if easing is enabled
     */
    //% block="is cart easing enabled"
    //% advanced=true
    //% group="Advanced"
    //% weight=50
    //% blockId=railcart_is_easing
    export function isEasingEnabled(): boolean {
        return easingEnabled
    }
    /**
        * Immediately finish the current rail ride.
    */
    //% block="force finish ride"
    //% group="Advanced"
    //% weight=80
    //% advanced=true
    //% blockId=railcart_force_finish
    export function forceFinishRide() {
        if (!activeCart) return
        activeCart.vx = 0
        activeCart.vy = 0
        activeCart = null
    }

    /**
        * Instantly move the cart to a position.
        * @param x x position
        * @param y y position
    */
    //% block="teleport cart to x $x y $y"
    //% x.defl=80 y.defl=60
    //% group="Advanced"
    //% weight=70
    //% advanced=true
    //% blockId=railcart_teleport
    export function teleportCart(x: number, y: number) {
        if (!activeCart) return
        activeCart.setPosition(x, y)
    }

    /**
        * Check if raw velocity override is active.
    */
    //% block="raw velocity override active"
    //% group="Advanced"
    //% weight=60
    //% advanced=true
    //% blockId=railcart_is_override
    export function isRawOverride(): boolean {
        return rawVelocityOverride
    }

    /**
     * Get the active cart sprite
     */
    //% block="active cart sprite"
    //% group="Advanced"
    //% advanced=true
    //% blockId=railcart_get_active_sprite
    export function getActiveCart(): Sprite {
        return activeCart
    }

    /**
     * Cancel a specific progress event
     */
    //% block="cancel progress event at %percent %"
    //% group="Advanced"
    //% advanced=true
    //% blockId=railcart_cancel_progress
    export function cancelProgressEvent(percent: number) {
        progressEvents = progressEvents.filter(e => e.percent !== percent)
    }
    // --- Passenger Blocks ---
    /**
     * Adds another sprite to ride the cart.
     */
    //% block="add passenger %p"
    //% group="Passengers"
    //% blockId=railcart_add_passenger
    export function addPassenger(p: Sprite) {
        passengers.push(p)
    }

    /**
     * Returns true if there are passengers on the cart
     */
    //% block="cart has passengers"
    //% group="Passengers"
    //% blockId=railcart_has_passengers
    export function hasPassengers(): boolean {
        return passengers.length > 0
    }

    /**
     * Get the passenger count
     */
    //% block="number of passengers on cart"
    //% group="Passengers"
    //% blockId=railcart_passenger_count
    export function passengerCount(): number {
        return passengers.length
    }

    /**
     * Clear all passengers 
     */
    //% block="remove all passengers"
    //% group="Passengers"
    //% blockId=railcart_clear_passengers
    export function clearPassengers() {
        passengers = []
    }

    /**
     * Detach a passenger from the cart
    */
    //% block="detach passenger %p"
    //% group="Passengers"
    //% blockId=railcart_detach_passenger
    export function detachPassenger(p: Sprite) {
        passengers = passengers.filter(ps => ps !== p)
    }

    /**
     * Teleport a passenger separately
    */
    //% block="teleport passenger %p to x $x y $y"
    //% group="Passengers"
    //% blockId=railcart_teleport_passenger
    export function teleportPassenger(p: Sprite, x: number, y: number) {
        p.setPosition(x, y)
    }

    /**
     * Check if a specific sprite is on the cart
    */
    //% block="is %p on the cart"
    //% group="Passengers"
    //% blockId=railcart_is_on_cart
    export function isOnCart(p: Sprite): boolean {
        return passengers.indexOf(p) !== -1
    }
}