Wardley Maps Tool
===============

An unofficial tool to create, manage and analyze Wardley Maps.

All the code is licensed under ASL 2.0, even if not explicitly stated, but unless otherwise stated.

Running your own instance
-------------------------
There is a common bias that novel & business critical tool must have big brands guarding them, because it warrants that those tools will not dissappear over night leaving users in the lurch. That is just plain wrong. If you would like to have your own instance of [The Wardley Maps Tool](http://wardleymaps.com/the-tool1.html), you can get it running in nearly no time. Instructions are available on a [project wiki] (https://github.com/cdaniel/wardleymapstool/wiki/Running-your-own-instance). 

How to contribute:
------------------
There is no big guide here, just checkout the code, find what you would like to improve, and send a patch back.
There is a plenty things that can be done, and every help is deeply appreciated. Some ideas include:
- [ ] creating ready-to-deploy packages (deb, rpm, heroku, openshift, cloud foundry and others)
- [ ] user manual
- [ ] improving tests
- [ ] other than g+ login mechanisms
- [ ] notification system
- [ ] multi-user edit
- [ ] ...
Every contribution will be recognized.

Coming soon:
------------
I wish I could promise you a lot of exciting features, but things I will be working next include:
1. mapeditor.js cleanup - that module is a spaghetti code mess. I need to find out a clean way to marry jsPlumb with the model that can be send back and forth to the server. Right now I query the jsPlumb instance before every save to gather list of nodes and connections.
2. Once the editor is somewhat cleaned, it is necessary to reconcile the database model and the client model. Ideally they should be using either the same schema, or some API should be described (with tests).
3. Login mechanisms need to be connected. Right now a user that registered using G+ is different from the user that registered in a traditional way using the same email address that was provided in G+.

UI Sketches:
-----------------
The sketches in the ui-sketches folder (those with the *.ep extension) are created with the Evolus Pencil tool, 
which is open source and can be downloaded for all platforms from [its homepage](http://pencil.evolus.vn/). They are just ideas that may be implemented one day.

Support, questions and similar:
-----------------
Via twitter [@wardleymaps](https://twitter.com/wardleymaps).
