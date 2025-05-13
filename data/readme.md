This is the default data directory, which can be changed by changing the
`DATA_DIR` variable in `backend/pixi.toml`

Files added to this directory, can be accessed from the frontend under the
`/data` endpoint (e.g. `http://localhost:5173/data/mesh-scene-test.json`)

** Do not add binary files to this repository **

While it will be possible (in the future) to push data to this directory, do not
commit binary files to the repository.  This directory should only hold example 
.json scene files
