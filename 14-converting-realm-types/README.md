# 14. Converting Realm Types

The following example show you how to convert realm types.  In the future, we will offer an API to do this.  For now, you can do this by editing the admin Realm, but make sure to do so with care!  The logic used in this script assumes that you do not have Realms paths that contain a double underscore which are present in system realms (which we do not wish to alter).

To run the converter: 
1) Run `npm install`
2) Open up 'convert.js'.  Input your instance information at the top (line 5).  You will need to make some slight modifications if using SSL (detailed in script).  You can take a look at the conversion logic around line 28 and tweak as necessary to match the realms which you'd like to convert
3) run `node convert.js`.
