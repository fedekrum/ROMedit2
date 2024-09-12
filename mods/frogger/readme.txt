VERSION 1 form Dec 23, 2020
https://forums.arcade-museum.com/threads/frogger-bugs-descriptions-and-fixes.482765/

Comments from @philmurr
Frogger is a cute game that was very successful back in the golden age. For such a successful game it has a number of well-known bugs that (for me at least) can spoil it.

I’d already done some work on Frogger code when adding it to the multigame, so knew a fair bit about it. Over the last few weeks I’ve spent time disassembling a lot of it
to try to find out what the programmers did wrong, and to put some fixes in place. A brief description of the bugs (and how to fix them) is below. There isn’t much spare
space in the Frogger ROMs so I was always conscious any fixes would have to be as simple as possible, but fortunately they all fit.

There isn’t a TL : DR version, I presume if you’re interested in this then you’ll want to know all the details! I guess the programmers must have been up against time
pressures or just didn’t test it well enough. The programming isn’t brilliant with a lot of odd routines but I think it’s still a great game.

I haven’t described nor fixed the music bug, that’s already been well-documented. Neither have I fixed the jump into the alligator bug because that’s moot as to whether
you should die there or not.
I will release the modified code if anyone is interested. It’s based on the Konami code, no high score save or freeplay routines, just how it should have been originally.

The worst bugs
Collision detection isn’t great, more so when you’re on the back of logs and turtles
It can be quite unfair, especially when you’re jumping off and onto objects in the water, often dying for no reason

Other no so bad ones
You can take control of the frog in attract mode when it’s on the top row of logs
If you’re on the bank (centre row) and jump up onto a turtle then back down, you can jump off the edge of the screen.
Jumping on the top row of logs sometimes goes very slowly
The lady frog can sometimes be invisible, then appear out of nothing but a strange colour


1 - Collision detection. It’s just about acceptable when on the road so I haven’t done anything to try to improve that. It’s not pixel-perfect,
but as you can be jumping in the x-axis whilst vehicles are moving in the y-axis, it does an ok job of it. But on the river you can make
perfectly good jumps to the end of the turtles or logs and still die.

The game sets up a table for each row of moving objects (logs, turtles), and stores the x-position of the right-hand edge of the object. The actual
position stored is 2 pixels right of the edge of the turtles and 4 pixels right of the edge of the logs. It then tries to work out if you are on any
of the objects by using the width of each object and seeing if your frog is in that right-to-left window. If it is then all is good, if not you’re in
the water and you die. So it gets the far right location slightly wrong, the width of the object is too small, and it bases the compare point for your
frog at the right-hand edge of it which causes all sorts of errors.

Rather than rewrite the collision-detection routines completely, I extended the width of the objects so they are correct and changed the frog compare
point to its centre point which makes it much more accurate, fair and playable.


2 - Dying for no reason on valid jumps. It’s been suggested there are invisible snakes or other enemies on the logs that kill you. I don’t believe that’s
true. There are 2 almost identical collision-detection routines that run dependent on which stage you are at in a vertical jump. It sometimes gets the
calculation wrong as to which row of objects it should be checking against, so if for example you’re on the very right hand edge of the top turtle row then
jump up onto the log above, it calculates you’re still on the turtle row, the turtle has gone from beneath you and assumes you’re in the water and you die.
To get around this, for the water stage you don’t really need both collision-detection routines so I’ve bypassed the one that causes the issues (but still run
it if you’re on the road stage).

3 - Taking control of the frog in attract mode. When you’re on the top row of logs, the game is always checking to see if you’re jumping into one of the homes.
Unfortunately the programmers didn’t first check to see if a game was in play and just check the player inputs anyway. Oddly there is some code immediately before
where it jumps to that does this check, so a quick code diversion and I get it to check first if a game is in play, if not then it doesn’t test for player inputs
and you can no longer control the frog in attract mode.

4 - If you’re on the bank (centre row) and jump up onto a turtle then back down, you can jump off the right edge of the screen (and can’t go the full distance on the
left edge). The x-position of your frog is $10 ($=hex) when on the left hand edge of the screen and $E0 when on the right hand edge. When you jump, you move in
multiples of $10 pixels so your position will always be $n0. But when you’re jumping around in the water and land on a turtle or log, you move by 2 pixels at a time.
So your x position may not be $n0, but instead $n2, $n4, etc. The game only checks to see if you are greater than $20 if jumping left and less than $E0 if jumping right,
so e.g. if your x position is $DE you can now jump right to $EE which is off the right of the screen. Likewise left, if your x position is $1E you’re not at the far
left of the screen but it doesn’t allow you to jump any further left. To get round this, I did some code that checks how many pixels you can still jump (in multiples
of 2, not $10) to get to the left ($10) or right ($E0) and allow you to jump that far, so you now stay on the screen.

5 - Jumping on the top row of logs sometimes goes very slowly. It has nothing to do with previously eating a fly. The game reads the player inputs, then directly
afterwards is the routine to perform the frog movement. The bug where you move slowly happens if you try to jump when you are below one of the homes and it has already
been filled. The game checks to see if the home is already filled and prevents you from jumping into that home again, but it brute forces it by simply not checking the
player inputs (so also stops the movement from progressing). So trying to jump left or right just before when you’re directly below an occupied home will start the
movement, then it will stop it whilst you are below the home, then start again when you are clear of it causing the odd stuttered movement. This was a bit trickier to
fix, so I went for the solution of only preventing the up player input from being processed (if you allow it, then it lets you fill the home multiple times...). So
allowing left, right and down to still be processed continued with the normal movement of the frog.


6 - The lady frog can sometimes be invisible, then appear out of nothing but a strange colour. I haven’t fixed this, and I’m having difficulty reproducing it and can’t
tell at this stage exactly what causes it. It has something to do with the lady frog x & y coordinates being populated by the player coordinates when the player lands
on where it should be, and the sprite being set to colour 0 (which gives the odd red colour). If someone can reproduce this and send me a mame .inp file of it happening,
I’ll work out what’s happening and document it.



VERSION 2 form Jun 7, 2023
Bug 6 from previous version is now fixed by @philmurr after reported way to reproduce it.
https://forums.arcade-museum.com/threads/frogger-bugs-descriptions-and-fixes.482765/post-4683021
https://youtu.be/nRgL04WBVXM 

Comments from @fedekrum
  I have an .inp file where I get the red/white frog

  The curious thing is that the frog comes from the left as a pink/light blue.
  Then it turns invisible on the log at the same time the number 200 of the fly caught disappears.
  When caught by the green frog (while invisible), it appears as the red/white frog.

Comments from @philmurr
  So thanks to @fedekrum sending the .inp file I've managed to work out the bug with the lady Frog.

  The fly characters are all sprites which are converted to a "200" (bonus) sprite when you get a frog home when there's a fly there.

  Also when you get the lady frog home, her sprite is converted to a "200" (bonus) sprite.

  There is then some common code that sets a time delay for how long the "200" stays on the screen, once this is complete, the code removes the bonus sprite. 
  Unfortunately this is where the bug happens. Regardless of whether you have got the bonus for the fly or for the lady frog, it removes the sprite data for both.

  This doesn't really matter if you get the lady frog home, the fly will also disappear. But if you get the fly, it has the unwanted effect of removing the lady 
  frog sprite data from memory. However the flag that tells the game that the lady frog is on the screen is still set but the sprite value and colour are now set 
  to 0 - she's invisible but still moves around the screen as intended. So when you jump on her, the sprite data is updated but with colour 0 which gives the odd 
  red/white/black effect. 

  So how to fix it... It's not particularly clean but it works. When the original code tries to get rid of the lady frog sprite data, my modified code does a check 
  to see if the lady frog sprite is "200", that is, you've got her home and she's been turned into the bonus. If so then correctly remove that sprite data, or 
  if not then do nothing. 
  There's not much ROM space left so I'm going to have to get rid of my name credit from the previous mods to fit in the code :(

  I've done the mod and checked it with the .inp file and all works as it should do, so I'm fairly sure it's fixed.



VERSION 3 from Jul 25, 2024 
MUSIC FIXES added by @fedekrum 
https://forums.arcade-museum.com/threads/frogger-bugs-descriptions-and-fixes.482765/post-4848253 


Comments from @fedekrum
  Here are the audio bug fixes @philmurr referred to in his first post on this thread. 
  They are all documented at "Computer Archeology" https://computerarcheology.com/Arcade/Frogger/SoundCode.html 

  1 - Missing eighth note 
  If you listen to the original song you'll hear a few "stretched-out" notes in the rhythm around the 30-second mark. The stretching appears in two adjacent phrases 
  of the music at this point. But the music defined below has straight eighth notes. The second voice of the music (farther below) has a half note starting at beat 
  one of the measure. The music below is missing an eighth note duration, and the half note starts an eighth note later than it should. The second voice lags behind the 
  first by an eighth note from that point on (but drops out because of the bug below). 

  2 - Garbage note stops the voice 
  This is about midway through the second voice of the main song. There are plenty of notes left, but the next note is mangled a bit. The note's duration is correct, 
  but the note number is all 1s, which stops the voice from playing 

  3 - Pitch is off by one 
  There are 60 notes defined in the frequency table. The music is defined with 5-bit note pitches providing a range of 32 notes for the song. Two of the values are 
  special: 0 means rest and 31 means "special command". Each song defines a base offset added to the pitch value allowing the range of 30 notes to be defined anywhere 
  in the note table. 

  The DEC below seems to make sense at first: a pitch value of 0 is a rest - we should decrement each note so that pitch value 1 is the first note (starting at 0) in 
  the range. But the ranges can be (and seem to be) defined with the "ignore 0" built-in. The DEC wastes CPU cycles, which isn't really a big deal. 

  But it is a big deal if you want to play along on the piano! The music offsets in the data below seem to be defined without the want of the DEC. If you look at the main 
  song intro notes without the decrement, they land on the big friendly white piano keys. With the decrement, they are 1/2 step down landing them on the black "accidentals". 


VERSION 3.1 from Xxx 00, 2024 
PIXEL CHANGE TO IDENTIFY FIXED VERSION OF FROGGER
https://forums.arcade-museum.com/threads/frogger-bugs-descriptions-and-fixes.482765/post-4848253 ????????????????????????


User @fedekrum changed the center pixel of the "screen/level icon" to black just to identify the fixed version of frogger on the screen.
This is absolutly optional and makes no change at all on how the game works.

