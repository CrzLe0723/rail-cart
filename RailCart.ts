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

    // --- Setup Blocks ---
    //% blockId=railcart_set_speed
    //% block="set cart base speed $speed boost $boost"
    //% group="Setup"
    //% speed.defl=0.8 boost.defl=5.5
    export function setSpeed(speed: number, boost: number) {
        baseSpeed = speed
        boostSpeed = boost
    }

    //% blockId=railcart_set_easing
    //% block="set easing type $type"
    //% group="Setup"
    export function setEasing(type: EasingType) {
        easing = type
    }

    //% blockId=railcart_is_active
    //% block="Is cart currently moving"
    //% group="Setup"
    export function isActive(): boolean {
        return active
    }

    //% blockId=railcart_set_cart_sound
    //% block="set cart sound %sound"
    //% group="Setup"
    export function setCartSound(sound: music.Playable) {
        music.play(sound, music.PlaybackMode.InBackground)
    }

    //% blockId=railcart_follow_camera
    //% block="follow cart with camera"
    //% group="Setup"
    export function followCartCamera() { scene.cameraFollowSprite(cart) }

    // --- Ride Blocks ---
    //% blockId=railcart_start_ride
    //% block="start rail ride rider %rider cart %cartSprite from %from to %to"
    //% group="Ride"
    //% rider.shadow="variables_get" cartSprite.shadow="variables_get"
    //% from.shadow="tiles_picker" to.shadow="tiles_picker"
    export function startRide(rider: Sprite, cartSprite: Sprite, from: tiles.Location, to: tiles.Location) {
        if (active) return
        player = rider
        cart = cartSprite
        start = from
        end = to
        passengers = []

        let s = tileCenter(start)
        let e = tileCenter(end)

        cart.x = s.x
        cart.y = s.y
        cart.setFlag(SpriteFlag.GhostThroughWalls, true)

        player.ay = 0
        controller.moveSprite(player, 0, 0)
        player.x = cart.x
        player.y = cart.y - 4

        totalDist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2)
        active = true
        startTime = game.runtime()
        estimatedDuration = totalDist / (baseSpeed + boostSpeed) * 16

        if (onStart) onStart()
    }

    //% blockId=railcart_add_passenger
    //% block="add passenger %p"
    //% group="Ride"
    //% p.shadow="variables_get"
    export function addPassenger(p: Sprite) {
        passengers.push(p)
    }

    //% blockId=railcart_pause_ride
    //% block="pause ride"
    //% group="Ride"
    export function pauseRide() { active = false }

    //% blockId=railcart_resume_ride
    //% block="resume ride"
    //% group="Ride"
    export function resumeRide() { active = true }

    //% blockId=railcart_stop_ride
    //% block="stop cart immediately"
    //% group="Ride"
    export function stopRide() { active = false }

    //% blockId=railcart_change_destination
    //% block="change ride destination to %to"
    //% group="Ride"
    //% to.shadow="tiles_picker"
    export function changeDestination(to: tiles.Location) { end = to }

    // --- Event Blocks ---
    //% blockId=railcart_on_ride_start
    //% block="on ride start %handler"
    //% group="Events"
    //% param.handler.shadow="procedures_callnoreturn"
    export function onRideStart(handler: () => void) {
        onStart = handler
    }

    //% blockId=railcart_on_ride_finish
    //% block="on ride finished %handler"
    //% group="Events"
    //% param.handler.shadow="procedures_callnoreturn"
    export function onRideFinish(handler: () => void) {
        onFinish = handler
    }

    //% blockId=railcart_on_ride_progress
    //% block="on ride progress %percent %handler"
    //% group="Events"
    //% percent.defl=50
    //% param.handler.shadow="procedures_callnoreturn"
    export function onRideProgress(percent: number, handler: () => void) {
        progressEvents.push({ percent, handler, triggered: false })
    }

    // --- Effects ---
    //% blockId=railcart_shake_cart
    //% block="shake cart for %duration ms"
    //% group="Effects"
    //% duration.defl=500
    export function shakeCart(duration: number) { /* ... */ }

    //% blockId=railcart_set_trail_effect
    //% block="set trail effect %eType with vx %vx vy %vy for %time ms attach to sprite %onSprite"
    //% group="Effects"
    //% vx.defl=0 vy.defl=0 time.defl=1000 onSprite.defl=true
    //% expandableArgumentMode="toggle"
    export function setTrailEffect(eType: EffectType, vx: number, vy: number, time: number, onSprite?: boolean, x?: number, y?: number) { /* ... */ }

    //% blockId=railcart_clear_effects
    //% block="clear cart effects"
    //% group="Effects"
    export function clearEffects() { effects.clearParticles(cart) }

    // --- Utilities ---
    //% blockId=railcart_get_speed
    //% block="current cart speed"
    //% group="Utilities"
    export function getSpeed(): number { return baseSpeed + boostSpeed }

    //% blockId=railcart_reverse_cart
    //% block="reverse cart direction"
    //% group="Utilities"
    export function reverseCart() { [start, end] = [end, start] }

    //% blockId=railcart_get_progress
    //% block="ride progress percent"
    //% group="Utilities"
    export function getProgress(): number { /* ... */ return 0 }

    //% blockId=railcart_time_remaining
    //% block="time remaining on cart ride (ms)"
    //% group="Utilities"
    //% advanced=true
    export function timeRemaining(): number { return 0 }

    // --- Advanced ---
    //% blockId=railcart_force_velocity
    //% block="force cart velocity vx $vx vy $vy"
    //% vx.defl=50 vy.defl=0
    //% group="Advanced"
    //% weight=100
    //% advanced=true
    export function forceVelocity(vx: number, vy: number) { /* ... */ }

    //% blockId=railcart_restore_movement
    //% block="restore normal cart movement"
    //% group="Advanced"
    //% weight=95
    //% advanced=true
    export function restoreMovement() { /* ... */ }

    //% blockId=railcart_disable_easing
    //% block="disable easing temporarily"
    //% group="Advanced"
    //% weight=90
    //% advanced=true
    export function disableEasing() { /* ... */ }

    //% blockId=railcart_enable_easing
    //% block="enable easing"
    //% group="Advanced"
    //% weight=85
    //% advanced=true
    export function enableEasing() { /* ... */ }

    //% blockId=railcart_force_finish_ride
    //% block="force finish ride"
    //% group="Advanced"
    //% weight=80
    //% advanced=true
    export function forceFinishRide() { /* ... */ }

    //% blockId=railcart_teleport_cart
    //% block="teleport cart to x $x y $y"
    //% x.defl=80 y.defl=60
    //% group="Advanced"
    //% weight=70
    //% advanced=true
    export function teleportCart(x: number, y: number) { /* ... */ }

    //% blockId=railcart_raw_override_active
    //% block="raw velocity override active"
    //% group="Advanced"
    //% weight=60
    //% advanced=true
    export function isRawOverride(): boolean { return rawVelocityOverride }

    // --- Helpers ---
    function tileCenter(t: tiles.Location) { return { x: t.col * 16 + 8, y: t.row * 16 + 8 } }
}