# ts-websockets


## How would I make a game with tow or more players that are hitting a buzzer over and over again

- so if one guy could hit the buzzer twice without another one hitting it he won
- we have a random trigger like if a number is dividable by 3 then hit if a number is dividable by 5 or 2
    or if a number is dividable by 7 or 13 or 11
- so all make a random number experiment and buzz when they have their criteria met
- the server checks if there is a buzz from the same client twice so we hold the id of the client and if they are the same so
    `id ^ id = 0` then we have a double buzz the game ends
- so we hack up multiple clients hope they have the same condition twice and let them fire their messages away at the server
- this should be a game we can check performance with that
