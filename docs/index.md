# RailCart Extension

The **RailCart** extension lets you create rail rides for sprites, add passengers, create effects, and control movement in your MakeCode Arcade games.

## Installation
1. Go to MakeCode Arcade
2. Click **Extensions** → search or import this extension

## Categories
- [Setup](Setup.md) – configure speed, easing, camera, and sound  
- [Ride](Ride.md) – start, stop, pause, resume rides  
- [Events](Events.md) – handle ride start, finish, progress, passengers  
- [Effects](Effects.md) – shake cart, trails, colors  
- [Utilities](20actions.%0A%0A%23%%%%20the%20combined%20base%20and%20boost%20speed.%0A%0A%23%23%20cart%20base%20speed%0AReturns%20the%20base%20speed.%0A%0A%23%23%20cart%20boost%20speed%0AReturns%20the%20boost%20speed.%0A%0A%23%23%20reverse%20cart%20direction%0ASwaps%20the%20start%20and%20end%20direction.%0A%0A%23%23%20cart%20position%0AReturns%20the%20cart%27s%20x%20and%20y%20position.%0A%0A%23%23%20cart%20is%20on%20tile%0AReturns%20the%20tile%20location%20the%20cart%20is%20currently%20on.%0A%0A%23%23%20distance%20to%20ride%20destination%0AReturns%20the%20remaining%20distance%20to%20the%20destination.%0A%0A%23%23%20ride%20progress%20percent%0AReturns%20how%20far%20along%20the%20ride%20is%20(0%E2%80%93100%25) – position, speed, direction, progress  
- [Advanced](https://arcade.makecode.com/---docs?md=%23%20Advanced20with%20care.%0A%0A%23%23%20force%20cart%20velocity%0AOverrides%20easing%20and%20directly%20sets%20velocity.%0A%0A%23%23%20restore%20normal%20cart%20movement%0AReturns%20control%20back%20to%20easing-based%20movement.%0A%0A%23%23%20disable%20easing%20temporarily%0ATurns%20off%20easing%20for%20sharp%20movement.%0A%0A%23%23%20enable%20easing%0ARe-enables%20easing.%0A%0A%23%23%20is%20cart%20easing%20enabled%0AReturns%20true%20if%20easing%20is%20enabled.%0A%0A%23%23%20force%20finish%20ride%0AImmediately%20ends%20the%20ride.%0A%0A%23%23%20teleport%20cart%0AMoves%20the%20cart%20instantly%20to%20a%20position.%0A%0A%23%23%20raw%20velocity%20override%20active%0AReturns%20true%20if%20raw%20velocity%20is%20enabled.%0A%0A%23%23%20active%20cart%20sprite%0AReturns%20the%20cart%20sprite%20being%20controlled.%0A%0A%23%23%20cancel%20progress%20event%0ARemoves%20a%20progress%20event%20at%20a%20specific%20percent.%0A) – raw velocity, teleport, force finish  
- [Passengers](https://arcade.makecode.com/---docs?md=%23%20Passenger%20Blocks%0A%0APassenger%20blocks%20let%20multiple%20sprites%20ride%20the%20cart.%0A%0A%23%23%20add%20passenger%0AAdds%20a%20sprite%20to%20the%20cart.%0A%0A%23%23%20detach%20passenger%0ARemoves%20a%20specific%20passenger%20from%20the%20cart.%0A%0A%23%23%20remove%20all%20passengers%0AClears%20all%20passengers.%0A%0A%23%23%20cart%20has%20passengers%0AReturns%20true%20if%20at%20least%20one%20passenger%20is%20present.%0A%0A%23%23%20number%20of%20passengers%20on%20cart%0AReturns%20how%20many%20passengers%20are%20riding.%0A%0A%23%23%20teleport%20passenger%0AMoves%20a%20passenger%20independently.%0A%0A%23%23%20is%20sprite%20on%20the%20cart%0AReturns%20true%20if%20the%20sprite%20is%20riding%20the%20cart.%0A) – add/remove passengers, check if on cart
