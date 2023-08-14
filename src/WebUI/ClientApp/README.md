# FreeBrowse Frontend

## First steps

We recommend to use Visual Studio Code as IDE and install the recommend workspace extensions.

### Run the database on mac

To get the database for the backend up locally on Mac-M1 (ARM) devices, we are using docker right now (to host a database supporting transactional queries).
First install docker. (https://docs.docker.com/desktop/install/mac-install/)
Run the docker container
```bash
docker run --cap-add SYS_PTRACE -e 'ACCEPT_EULA=1' -e 'MSSQL_SA_PASSWORD=yourStrong(!)Password' -p 1433:1433 --name azuresqledge -d mcr.microsoft.com/azure-sql-edge
```

You need to copy the `ConnectionStrings` from the `appsettings.Development.mac.json` to `appsettings.Development.json`, since i have not found a way yet to include it automatically without messing up the configuration for windows users.

Afterwards you can start the project using
- the Visual Studio run button
- F5 in visual studio code
- Or execute the npm commands by hand (npm run server && npm start)

### Check the Swagger API

To take a look at the swagger api, you need to start the project from `Visual Studio` right now, NOT VSCode.
Than you will be able to browse the api under the URL https://localhost:5001/api/index.html?url=/api/specification.json#/
This also need to get done at least once on API changes or on initial setup to generate the typescript api file, used by the frontend code.

### How to develop

The project has been set up with eslint and prettier configuration to keep the developer from doing common mistakes and help to align on the same style on the project. We recommend to use the VSCode application and install the recommended extensions (.vscode/extensions.json). Afterwards the IDE should highlight the static code analysis rules already.

### How to debug

To debug the project, you should be able to just press F5 to run the server. In general that should also start the Backend on proper setup, but you can also start the Backend from Visual Studio and then run F5. It will only run the Frontend part then and start a Chrome Browser instance for you, with already connected debugger. You should be able to see the Debug logs in the DEBUG CONSOLE in VSCode and you should be able to set breakpoints directly in VSCode.
Whenever a file is saved, the browser will automatically adapt to the change and reload that part of the page accordingly.

## Tailwind

[Cheatsheet](https://tailwindcomponents.com/cheatsheet/)

We decided to use tailwind (instead of bootstrap) because its:
- more flexible and smaller
- recommend for webapps (while bootstrap has its advantages on websites)
- we have designers, so we need to build our own themes anyway
