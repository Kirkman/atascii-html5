ATASCII HTML5 viewer
====================

This is an experimental system for displaying Atari 8-bit ATASCII animations using Javascript and HTML5.

The system is not multiline aware yet, but at this point seems to play most animations with few glitches.


Hidden commands
---------------

The following hidden commands can be invoked by hitting a key on your keyboard while an animation is playing:

key   | Action
----- | ------------------------------------------------------------------------------
P     | Print screen -- create an IMG element for saving screen capture as PNG
C     | Capture animation -- toggle to start/finish saving frames. Makes animated GIF.
ESC   | Stop animation

These two hidden commands work only in diagnostic mode:

key   | Action
----- | ------------------------------------------------------------------------------
LEFT  | Step backward one frame
RIGHT | Step forward one frame


Changelog
---------

### v0.3

* Numerous emulation fixes
* Rudimentary support for controlling playback speed

### v0.2

* Added full-screen mode

### v0.1

* First publicly-available version. Still a beta.


Resources
---------

I found the following resources very handy in decoding the ATASCII format:
* [Mapping the Atari](http://www.atariarchives.org/mapping/appendix10.php) Appendix 10. 
* [ATASCII table](http://joyfulcoder.net/atari/atascii/) at joyfulcoder.net. 
* [ATASCII article](https://en.wikipedia.org/wiki/ATASCII) at wikipedia.org. 

One big reason I was inspired to create this viewer was finding the old ["Break Movie Warehouse" website](https://web.archive.org/web/20000312095027/http://www.flash.net/~ambrosia/index3.html), which is archived in the Wayback Machine. This site was created by Tom D'Ambrosio to showcase the many ATASCII animations he created over the years. It included a Java applet by Tony Smolar which would play the animations in a web browser. But Java has changed a lot since then, and the applet doesn't work anymore. 