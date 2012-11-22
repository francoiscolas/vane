Vane
====

*Vane* is a web framework for Node.js.


Installation
------------

```bash
$ npm install -g git://github.com/francoiscolas/vane.git
```


Usage
-----

```bash
$ vane new <path> # Create a new application.
$ vane assets     # Generate js and css files.
$ vane routes     # Print defined routes.
```


Quick start
-----------

To create a new application:
```bash
$ vane new my-app   # Generate files.
$ cd my-app         # Change current working directory.
$ npm install -d    # Install application's dependencies.
$ node .            # Start listening on http://localhost:8080/.
```


The newly created directory should looks like this:
```
.
|-- app -> Contains controllers, views and models.
|   |-- controllers
|   |   |-- application_controller.js
|   |   `-- home_controller.js
|   |-- views
|   |   |-- layouts
|   |   |   `-- application.html.jst
|   |   `-- home
|   |       `-- index.html.jst
|   `-- models
|-- config -> Configuration files.
|   |-- application.js
|   |-- assets.json
|   |-- database.json
|   `-- routes.js
|-- public -> Static files.
|   `-- css
|       |-- home
|       |   `-- index.css
|       |-- core.css
|       `-- normalize.css
|-- index.js -> Bootstrap file.
`-- package.json -> Node.js's module description file.
```


Git repository
--------------

https://github.com/francoiscolas/vane


License
-------

MIT license

Copyright (C) 2011 by François Colas <francoiscolas@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
