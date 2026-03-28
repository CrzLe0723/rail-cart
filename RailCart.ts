
//% weight=90 color=#444444 icon="\uf238" groups='["Ride","Setup","Events","Effects","Utilities","Audio","Passengers","Advanced"]'
namespace railCart {
    // --- Internal state ---
    let networks: RailNetwork[] = []
    let activeNetwork: RailNetwork = null
    let currentRouteId = ""
    let active = false
    let player: Sprite = null
    let cart: Sprite = null
    let start: tiles.Location = null
    let end: tiles.Location = null
    let path: tiles.Location[] = []
    let currentNode = 0
    let pathMode = false
    let segmentStart: tiles.Location = null
    let segmentEnd: tiles.Location = null
    let segmentDist = 0
    let totalDist = 0
    let baseSpeed = 0.8
    let boostSpeed = 5.5
    let passengers: Sprite[] = []
    let effectType: any = null
    let easingEnabled = true
    let rawVelocityOverride = false
    let startTime = 0
    let estimatedDuration = 0
    let trailLoopEnabled = false
    let effectColor: number = 0
    const RAILCART_DATA_KEY = "RAILCART_DATA"
    const START_HANDLERS_KEY = RAILCART_DATA_KEY + "_START"
    const FINISH_HANDLERS_KEY = RAILCART_DATA_KEY + "_FINISH"
    const PROGRESS_HANDLERS_KEY = RAILCART_DATA_KEY + "_PROGRESS"
    const PAUSE_HANDLERS_KEY = RAILCART_DATA_KEY + "_PAUSE"
    const RESUME_HANDLERS_KEY = RAILCART_DATA_KEY + "_RESUME"
    const PASSENGER_HANDLERS_KEY = RAILCART_DATA_KEY + "_PASSENGER"
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
        //% block="forward" 
        Forward,
        //% block="backward" 
        Backward
    }
    let direction: CartDirection = CartDirection.Forward
    //--- rail-network---
    interface RailNetwork {
        id: string
        stations: tiles.Location[]
        routes: RailRoute[]
    }

    interface RailRoute {
        id: string
        path: tiles.Location[]
        loop: boolean
    }
    // --- Setup Blocks ---
    /**
     * Creates a rail network
     */
    //% block="create rail network $id"
    //% subcategory="Setup"
    //% blockId=railcart_create_network
    export function createNetwork(id: string): RailNetwork {
        let net: RailNetwork = {
            id: id,
            stations: [],
            routes: []
        }

        networks.push(net)
        activeNetwork = net
        return net
    }
    /**
     * Add a station to the active network
     */
    //% block="add station at %tile to network"
    //% subcategory="Ride"
    //% blockId=railcart_add_station
    //% tile.shadow="mapgettile"
    export function addStation(tile: tiles.Location) {
        if (!activeNetwork) return
        activeNetwork.stations.push(tile)
    }
    /**
     * Create a route in the active network
     */
    //% block="add route $id through %path"
    //% subcategory="Ride"
    //% blockId=railcart_add_route
    //% path.shadow="lists_create_with"
    export function addRoute(id: string, path: tiles.Location[], loop: boolean) {
        if (!activeNetwork || path.length < 2) return

        let route: RailRoute = {
            id: id,
            path: path,
            loop: loop
        }

        activeNetwork.routes.push(route)
    }
    /**
     * Start ride using a network route
     */
    //% block="start network ride rider %rider cart %cartSprite network $networkId route $routeId"
    //% subcategory="Ride"
    //% blockId=railcart_start_network_ride
    export function startNetworkRide(rider: Sprite, cartSprite: Sprite, networkId: string, routeId: string) {

        let net = networks.find(n => n.id == networkId)
        if (!net) return

        let route = net.routes.find(r => r.id == routeId)
        if (!route) return

        player = rider
        cart = cartSprite

        path = route.path
        currentNode = 0
        pathMode = true
        activeNetwork = net
        currentRouteId = routeId

        segmentStart = path[0]
        segmentEnd = path[1]

        let s = tileCenter(segmentStart)

        cart.setPosition(s.x, s.y)
        cart.setFlag(SpriteFlag.GhostThroughWalls, true)

        player.ay = 0
        controller.moveSprite(player, 0, 0)
        player.x = cart.x
        player.y = cart.y - 4

        segmentDist = spriteutils.distanceBetween(segmentStart, segmentEnd)

        active = true
        startTime = game.runtime()

        resetProgressEvents()
        fireRideStart()
    }
    /**
     * Remove a rail network by id
     */
    //% block="remove rail network $id"
    //% subcategory="Setup"
    //% blockId=railcart_remove_network
    export function removeNetwork(id: string) {
        networks = networks.filter(n => n.id != id)

        if (activeNetwork && activeNetwork.id == id) {
            activeNetwork = null
            path = []
            pathMode = false
            currentNode = 0
        }
    }
    /**
     * Remove all rail networks
     */
    //% block="clear all rail networks"
    //% subcategory="Setup"
    //% blockId=railcart_clear_networks
    export function clearNetworks() {
        networks = []
        activeNetwork = null

        path = []
        pathMode = false
        currentNode = 0
    }
    /**
     * Check if a network exists
     */
    //% block="network $id exists"
    //% subcategory="Utilities"
    //% blockId=railcart_network_exists
    export function networkExists(id: string): boolean {
        return networks.some(n => n.id == id)
    }
    /**
     * Set the active network
     */
    //% block="set active network $id"
    //% subcategory="Setup"
    //% blockId=railcart_set_active_network
    export function setActiveNetwork(id: string) {
        let net = networks.find(n => n.id == id)
        if (net) activeNetwork = net
    }
    /**
     * Switch to another route in same network
     */
    //% block="switch to route $routeId"
    //% subcategory="Ride"
    //% blockId=railcart_switch_route
    export function switchRoute(routeId: string) {
        if (!activeNetwork) return

        let route = activeNetwork.routes.find(r => r.id == routeId)
        if (!route) return

        path = route.path
        currentNode = 0
        segmentStart = path[0]
        segmentEnd = path[1]
    }
    /**
     * Find nearest station in network
     */
    //% block="nearest station"
    //% subcategory="Utilities"
    //% blockId=railcart_nearest_station
    export function nearestStation(): tiles.Location {
        if (!activeNetwork || !cart) return null

        let best = activeNetwork.stations[0]
        let bestDist = 999999

        for (let s of activeNetwork.stations) {
            let d = spriteutils.distanceBetween(getCartTile(), s)
            if (d < bestDist) {
                bestDist = d
                best = s
            }
        }

        return best
    }
    /**
     * Set the base and boost speed for the cart
     */
    //% block="set cart base speed $speed boost $boost"
    //% subcategory="Setup"
    //% speed.defl=0.8 boost.defl=5.5
    //% blockId=railcart_set_speed
    //% weight=100
    export function setSpeed(speed: number, boost: number) {
        baseSpeed = speed
        boostSpeed = boost
    }

    /**
     * Chooses how the cart accelerates/decelerates.
     */
    //% block="set easing type $type"
    //% subcategory="Setup"
    //% blockId=railcart_set_easing
    //% weight=95
    export function setEasing(type: EasingType) {
        easing = type
    }

    /**
     * Returns true if the cart is currently moving
     */
    //% block="is cart currently moving"
    //% subcategory="Setup"
    //% blockId=railcart_is_active
    //% weight=85
    export function isActive(): boolean {
        return active
    }

    /**
     * Sets a sound for the cart
     */
    //% block="set cart sound %sound"
    //% subcategory="Audio"
    //% blockId=railcart_set_sound
    export function setCartSound(sound: music.Playable) {
        music.play(sound, music.PlaybackMode.InBackground)
    }

    /**
     * Makes the camera follow the cart
     */
    //% block="follow cart with camera"
    //% subcategory="Setup"
    //% blockId=railcart_follow_camera
    //% weight=90
    export function followCartCamera() { scene.cameraFollowSprite(cart) }
    

    // --- Ride Blocks ---
    /**
     * Starts a rail cart ride from one tile to another.
    */
    //% block="start rail ride rider %rider cart %cartSprite from %from to %to"
    //% subcategory="Ride"
    //% blockId=railcart_start_ride
    //% weight=100
    //% rider.shadow="variables_get"
    //% rider.defl="rider"
    //% cartSprite.shadow="variables_get"
    //% cartSprite.defl="cart"
    //% help=github:rail-cart/docs/blocks/start-ride
    //% from.shadow="mapgettile"
    //% to.shadow="mapgettile"
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

        // Lock player
        player.ay = 0
        controller.moveSprite(player, 0, 0)
        player.x = cart.x
        player.y = cart.y - 4

        totalDist = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2)
        active = true
        startTime = game.runtime()
        estimatedDuration = totalDist / (baseSpeed + boostSpeed) * 16
        resetProgressEvents()
        fireRideStart()

    }
    /**
     * Starts a rail ride through multiple points
     */
    //% block="start rail path ride rider %rider cart %cartSprite through %pathInput"
    
    //% subcategory="Ride"
    //% blockId=railcart_start_path_ride
    //% pathInput.shadow="lists_create_with"
    //% weight=99
    //% rider.shadow="variables_get"
    //% rider.defl="rider"
    //% cartSprite.shadow="variables_get"
    //% cartSprite.defl="cart"
    export function startPathRide(rider: Sprite, cartSprite: Sprite, pathInput: tiles.Location[]) {
        if (!pathInput || pathInput.length < 2) return

        player = rider
        cart = cartSprite
        path = pathInput
        currentNode = 0
        pathMode = true

        passengers = []

        segmentStart = path[0]
        segmentEnd = path[1]

        let s = tileCenter(segmentStart)

        cart.setPosition(s.x, s.y)
        cart.setFlag(SpriteFlag.GhostThroughWalls, true)

        // Lock player
        player.ay = 0
        controller.moveSprite(player, 0, 0)
        player.x = cart.x
        player.y = cart.y - 4

        segmentDist = spriteutils.distanceBetween(segmentStart, segmentEnd)

        active = true
        startTime = game.runtime()
        resetProgressEvents()
        fireRideStart()
    }
    /**
     * Gets a tile location for path building
     */
    //% block="tile location at $col $row"
    //% blockId=railcart_tile_location
    //% subcategory="Ride"
    //% weight=5
    export function railTileLocation(col: number, row: number): tiles.Location {
        return tiles.getTileLocation(col, row)
    }
    /**
     * Temporarily stops the cart mid-ride.
     */
    //% block="pause ride"
    //% subcategory="Ride"
    //% blockId=railcart_pause_ride
    //% weight=94
    export function pauseRide() {
        if (!active) return
        active = false
        firePause()
    }

    /**
     * Resumes the cart if paused.
     */
    //% block="resume ride"
    //% subcategory="Ride"
    //% blockId=railcart_resume_ride
    //% weight=96
    export function resumeRide() {
        if (active) return
        active = true
        fireResume()
    }

    /**
     * Immediately stops the cart and unlocks the player.
     */
    //% block="stop cart immediately"
    //% subcategory="Ride"
    //% blockId=railcart_stop_ride
    //% weight=92
    export function stopRide() { active = false }

    /**
     * Returns true if the ride has finished
     */
    //% block="cart ride finished?"
    //% subcategory="Utilities"
    //% blockId=railcart_has_finished
    export function hasRideFinished(): boolean {
        return !active && player !== null
    }

    /**
     * Returns true if the ride is paused
     */
    //% block="is cart paused"
    //% subcategory="Utilities"
    //% blockId=railcart_is_paused
    export function isPaused(): boolean {
        return !active && player != null && distanceToDestination() > 0
    }
    /**
     * Change the destination to another location
     */
    //% block="change ride destination to %to"
    //% subcategory="Ride"
    //% blockId=railcart_change_destination
    //% weight=98
    //% to.shadow="mapgettile"
    export function changeDestination(to: tiles.Location) {
        if (pathMode) {
            path[path.length - 1] = to
        } else {
            end = to
        }
    }

    // --- Event Blocks ---

    /**
     * Run the code when the ride starts.
    */
    //% block="on rail ride start"
    //% blockId=railcart_on_ride_start
    //% draggableParameters="reporter"
    //% subcategory="Events"
    export function onRideStart(handler: () => void) {
        game.addScenePushHandler(() => {
            const scene = game.currentScene()
            let handlers = scene.data[START_HANDLERS_KEY] as (() => void)[]
            if (!handlers) {
                scene.data[START_HANDLERS_KEY] = handlers = []
            }
            handlers.push(handler)
        })
    }

    /**
     * Run the code when the ride finishes.
    */
    //% blockId=railcart_on_finish
    //% block="on rail ride finished"
    //% draggableParameters="reporter"
    //% subcategory="Events"
    export function onRideFinish(handler: () => void) {
        game.addScenePushHandler(() => {
            const scene = game.currentScene()
            let handlers = scene.data[FINISH_HANDLERS_KEY] as (() => void)[]
            if (!handlers) {
                scene.data[FINISH_HANDLERS_KEY] = handlers = []
            }
            handlers.push(handler)
        })
    }

    /**
     * Runs the code when the ride progress reaches a certain point
    */
    //% blockId=railcart_on_progress
    //% block="on rail ride progress %percent%"
    //% draggableParameters="reporter"
    //% percent.defl=50
    //% subcategory="Advanced"
    export function onRideProgress(percent: number, handler: () => void) {
        game.addScenePushHandler(() => {
            const scene = game.currentScene()
            let handlers = scene.data[PROGRESS_HANDLERS_KEY] as ProgressEvent[]
            if (!handlers) {
                scene.data[PROGRESS_HANDLERS_KEY] = handlers = []
            }
            handlers.push({ percent, handler, triggered: false })
        })
    }
    //% block="on passenger added"
    ///% draggableParameters="reporter"
    //% subcategory="Events"
    //% blockId=railcart_on_passenger_added
    export function onPassengerAdded(handler: () => void) {
        game.addScenePushHandler(() => {
            const scene = game.currentScene()
            let handlers = scene.data[PASSENGER_HANDLERS_KEY] as (() => void)[]
            if (!handlers) {
                scene.data[PASSENGER_HANDLERS_KEY] = handlers = []
            }
            handlers.push(handler)
        })
    }
   

    //% block="on cart paused"
    //% draggableParameters="reporter"
    //% subcategory="Events"
    //% blockId=railcart_on_pause
    export function onCartPaused(handler: () => void) {
        game.addScenePushHandler(() => {
            let handlers = game.currentScene().data[PAUSE_HANDLERS_KEY] as (() => void)[]
            if (!handlers) {
                game.currentScene().data[PAUSE_HANDLERS_KEY] = handlers = []
            }
            handlers.push(handler)
        })
    }
    
    //% block="on cart resumed"
    //% draggableParameters="reporter"
    //% subcategory="Events"
    //% blockId=railcart_on_resume
    export function onCartResumed(handler: () => void) {
        game.addScenePushHandler(() => {
            const scene = game.currentScene()
            let handlers = scene.data[RESUME_HANDLERS_KEY] as (() => void)[]
            if (!handlers) {
                scene.data[RESUME_HANDLERS_KEY] = handlers = []
            }
            handlers.push(handler)
        })
    }


    


    /**
     * Run code when cart reaches midpoint (50%)
     */
    //% block="on cart midpoint reached"
    //% subcategory="Events"
    //% blockId=railcart_on_midpoint
    //% draggableParameters="reporter"
    export function onCartMidpoint(handler: () => void) {
        onRideProgress(50, handler)
    }

    // --- Helper ---
    function tileCenter(t: tiles.Location) {
        return { x: t.col * 16 + 8, y: t.row * 16 + 8 }
    }
    function getStartHandlers(): (() => void)[] {
        return game.currentScene().data[START_HANDLERS_KEY];
    }

    function getFinishHandlers(): (() => void)[] {
        return game.currentScene().data[FINISH_HANDLERS_KEY];
    }

    function getProgressHandlers(): ProgressEvent[] {
        return game.currentScene().data[PROGRESS_HANDLERS_KEY];
    }

    function fireRideStart() {
        const handlers = getStartHandlers();
        if (handlers) handlers.slice().forEach(h => h())
    }

    function fireRideFinish() {
        const handlers = getFinishHandlers();
        if (handlers) handlers.slice().forEach(h => h())
    }
    function firePause() {
        const handlers = game.currentScene().data[PAUSE_HANDLERS_KEY] as (() => void)[]
        if (handlers) handlers.slice().forEach(h => h())
    }

    function fireResume() {
        const handlers = game.currentScene().data[RESUME_HANDLERS_KEY] as (() => void)[]
        if (handlers) handlers.slice().forEach(h => h())
    }

    function firePassengerAdded() {
        const handlers = game.currentScene().data[PASSENGER_HANDLERS_KEY] as (() => void)[]
        if (handlers) handlers.slice().forEach(h => h())
    }
    function resetProgressEvents() {
        const handlers = getProgressHandlers();
        if (handlers) handlers.forEach(h => h.triggered = false);
    }
    // --- Update Loop ---
    game.onUpdate(function () {
        if (!active) return
        if (rawVelocityOverride) return

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
            p.vx = 0
            p.vy = 0
            p.x = cart.x
            p.y = cart.y - 4
        }
        const handlers = getProgressHandlers()
        if (handlers) {
            for (const h of handlers) {
                if (!h.triggered && progress >= h.percent / 100) {
                    h.triggered = true
                    h.handler()
                }
            }
        }
    })

    function finishRide() {
        active = false
        pathMode = false
        path = []
        currentNode = 0

        let finalTile = pathMode ? segmentEnd : end

        active = false
        pathMode = false
        path = []
        currentNode = 0

        tiles.placeOnTile(player, finalTile)

        player.ay = 500
        controller.moveSprite(player, 75, 0)

        rawVelocityOverride = false
        easingEnabled = true
        passengers = []

        fireRideFinish()
    }
    interface ProgressEvent {
        percent: number
        handler: () => void
        triggered: boolean
    }
    // --- Effect Blocks ---

    /**
     * Shakes the cart for the specified duration
     * @param duration how long to shake the cart for
     */
    //% block="shake cart for %duration ms"
    //% subcategory="Effects"
    //% duration.defl=500
    //% duration.shadow=timePicker
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
    //% block="set trail effect %eType with vx %vx vy %vy for %time ms attach to sprite %onSprite||at x %x y %y"
    //% subcategory="Effects"
    //% vx.defl=0 vy.defl=0 time.defl=1000 time.shadow=timePicker
    //% onSprite.defl=true
    //% expandableArgumentMode="toggle"
    //% x.shadow="math_number"
    //% y.shadow="math_number"
    //% x.defl=0
    //% y.defl=0
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

                extraEffects.createSpreadEffectAt(fx, x, y, time)
            }
        }
    }

    /**
     * Clears any effects on the cart
    */
    //% block="clear any effect on cart"
    //% subcategory="Effects"
    //% blockId=railcart_clear_effects
    export function clearEffects() {
        effects.clearParticles(cart)
    }

    /**
     * Set trail effect color (for Dust/Sparks/Steam)
     */
    //% block="set trail effect color $color"
    //% subcategory="Effects"
    //% blockId=railcart_trail_color
    export function setTrailColor(color: number) {
        effectColor = color
    }

    /**
     * Make the trail effect loop continuously
     */
    //% block="loop trail effect $enabled"
    //% subcategory="Effects"
    //% blockId=railcart_loop_effect
    export function loopTrailEffect(enabled: boolean) {
        trailLoopEnabled = enabled
    }

    // --- Utilities Blocks ---
    /**
     * Gets the cart's current speed
     */
    //% block="current cart speed"
    //% subcategory="Utilities"
    //% blockId=railcart_get_speed
    export function getSpeed(): number { return baseSpeed + boostSpeed }

    /**
     * Reverses the cart's movement
     */
    //% block="reverse cart direction"
    //% subcategory="Utilities"
    //% blockId=railcart_reverse
    export function reverseCart() {
        if (pathMode) {
            path.reverse()
            currentNode = 0
            segmentStart = path[0]
            segmentEnd = path[1]
        } else {
            [start, end] = [end, start]
        }
    }
    //% block="cart x position"
    //% subcategory="Utilities"
    //% blockId=railcart_cart_x
    export function cartX(): number {
        return cart ? cart.x : 0
    }

    //% block="cart y position"
    //% subcategory="Utilities"
    //% blockId=railcart_cart_y
    export function cartY(): number {
        return cart ? cart.y : 0
    }

    /**
     * Get the tile the cart is on
     */
    //% block="cart is on tile"
    //% subcategory="Utilities"
    //% blockId=railcart_get_tile
    export function getCartTile(): tiles.Location {
        return tiles.getTileLocation(Math.floor(cart.x / 16), Math.floor(cart.y / 16))
    }

    /**
     * Get the distance to the destination
     */
    //% block="distance to ride destination"
    //% subcategory="Utilities"
    //% blockId=railcart_distance_to_end
    export function distanceToDestination(): number {
        if (!cart) return 0

        if (pathMode) {
            let dist = 0

            let current = tileCenter(getCartTile())
            let next = tileCenter(segmentEnd)

            dist += Math.sqrt((next.x - current.x) ** 2 + (next.y - current.y) ** 2)

            for (let i = currentNode + 1; i < path.length - 1; i++) {
                dist += spriteutils.distanceBetween(path[i], path[i + 1])
            }

            return dist
        }

        if (!end) return 0

        let dx = tileCenter(end).x - cart.x
        let dy = tileCenter(end).y - cart.y
        return Math.sqrt(dx * dx + dy * dy)
    }
    /**
     * Gets the progress of the current rail ride in percent
    */
    //% block="ride progress percent"
    //% subcategory="Utilities"
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
    //% subcategory="Utilities"
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
    //% subcategory="Utilities"
    //% blockId=railcart_set_direction
    export function setDirection(dir: CartDirection) {
        if (!cart) return
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
    //% subcategory="Utilities"
    //% blockId=railcart_get_direction
    export function getDirection(): CartDirection {
        return direction
    }

    // --- Speed Helpers ---

    /**
     * Get the cart's base speed
     */
    //% block="cart base speed"
    //% subcategory="Utilities"
    //% blockId=railcart_get_base_speed
    export function getBaseSpeed(): number { return baseSpeed }

    /**
     * Get the cart's boost speed
     */
    //% block="cart boost speed"
    //% subcategory="Utilities"
    //% blockId=railcart_get_boost_speed
    export function getBoostSpeed(): number { return boostSpeed }

    /**
     * Temporarily boost the cart speed for a duration
     */
    //% block="boost cart by $amount for $duration ms"
    //% subcategory="Utilities"
    //% blockId=railcart_temp_boost
    //% amount.defl=50
    //% duration.shadow=timePicker
    //% duration.defl=80
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
    //% weight=100
    //% subcategory="Advanced"
    //% blockId=railcart_force_velocity
    export function forceVelocity(vx: number, vy: number) {
        if (!cart) return
        rawVelocityOverride = true
        cart.vx = vx
        cart.vy = vy
    }

    /**
        * Restore normal cart movement and re-enable easing.
    */
    //% block="restore normal cart movement"
    //% weight=95
    //% subcategory="Advanced"
    //% blockId=railcart_restore_movement
    export function restoreMovement() {
        rawVelocityOverride = false
        easingEnabled = true
    }
    /**
        * Temporarily disable easing for sharp movement.
    */
    //% block="disable easing temporarily"
    //% weight=90
    //% subcategory="Advanced"
    //% blockId=railcart_disable_easing
    export function disableEasing() {
        easingEnabled = false
    }

    /**
        * Re-enable cart easing.
    */
    //% block="enable easing"
    //% weight=85
    //% subcategory="Advanced"
    //% blockId=railcart_enable_easing
    export function enableEasing() {
        easingEnabled = true
    }

    /**
     * Returns true if easing is enabled
     */
    //% block="is cart easing enabled"
    //% subcategory="Utilities"
    //% weight=50
    //% blockId=railcart_is_easing
    export function isEasingEnabled(): boolean {
        return easingEnabled
    }
    /**
        * Immediately finish the current rail ride.
    */
    //% block="force finish ride"

    //% weight=80
    //% subcategory="Advanced"
    //% blockId=railcart_force_finish
    export function forceFinishRide() {
        if (!cart) return
        cart.vx = 0
        cart.vy = 0
        cart = null
        active = false
        rawVelocityOverride = false
        passengers = []
        finishRide()
    }

    /**
        * Instantly move the cart to a position.
        * @param x x position
        * @param y y position
    */
    //% block="teleport cart to x $x y $y"
    //% x.defl=80 y.defl=60
    //% weight=70
    //% subcategory="Advanced"
    //% blockId=railcart_teleport
    export function teleportCart(x: number, y: number) {
        if (!cart) return
        cart.setPosition(x, y)
    }

    /**
        * Check if raw velocity override is active.
    */
    //% block="raw velocity override active"
    //% weight=60
    //% subcategory="Advanced"
    //% blockId=railcart_is_override
    export function isRawOverride(): boolean {
        return rawVelocityOverride
    }

    /**
     * Get the active cart sprite
     */
    //% block="active cart sprite"
    //% subcategory="Advanced"
    //% blockId=railcart_get_active_sprite
    export function getActiveCart(): Sprite {
        return cart
    }

    
    // --- Passenger Blocks ---
    /**
     * Adds another sprite to ride the cart.
     */
    //% block="add passenger %p"
    //% subcategory="Passengers"
    //% blockId=railcart_add_passenger
    //% p.shadow="variables_get"
    //% p.defl="passenger"
    export function addPassenger(p: Sprite) {
        passengers.push(p)
        firePassengerAdded()
    }

    /**
     * Returns true if there are passengers on the cart
     */
    //% block="cart has passengers"
    //% subcategory="Passengers"
    //% blockId=railcart_has_passengers
    export function hasPassengers(): boolean {
        return passengers.length > 0
    }

    /**
     * Get the passenger count
     */
    //% block="number of passengers on cart"
    //% subcategory="Passengers"
    //% blockId=railcart_passenger_count
    export function passengerCount(): number {
        return passengers.length
    }

    /**
     * Clear all passengers 
     */
    //% block="remove all passengers"
    //% subcategory="Passengers"
    //% blockId=railcart_clear_passengers
    export function clearPassengers() {
        passengers = []
    }

    /**
     * Detach a passenger from the cart
    */
    //% block="detach passenger %p"
    //% subcategory="Passengers"
    //% blockId=railcart_detach_passenger
    //% p.shadow="variables_get"
    //% p.defl="passenger"
    export function detachPassenger(p: Sprite) {
        passengers = passengers.filter(ps => ps !== p)
    }

    /**
     * Teleport a passenger separately
    */
    //% block="teleport passenger %p to x $x y $y"
    //% subcategory="Passengers"
    //% blockId=railcart_teleport_passenger
    //% p.shadow="variables_get"
    //% p.defl="passenger"
    export function teleportPassenger(p: Sprite, x: number, y: number) {
        p.setPosition(x, y)
    }

    /**
     * Check if a specific sprite is on the cart
    */
    //% block="is %p on the cart"
    //% subcategory="Passengers"
    //% blockId=railcart_is_on_cart
    //% p.shadow="variables_get"
    //% p.defl="passenger"
    export function isOnCart(p: Sprite): boolean {
        return passengers.indexOf(p) !== -1
    }
}