# FreeBrowse Frontend

## First steps

We recommend to use Visual Studio Code as IDE and install the recommend workspace extensions.

Open the Folder `ClientApp` on VSCode to be able to run the project with F5 and have the full support of the recommend extensions.
Feel free to install the recommend extensions defined in the .vscode/extensions.json file.
The fastest way to launch and debug the frontend (along with a local backend deployment) is to press **F5** in Visual Studio code.

### Run the database on mac

To get the database for the backend up locally on Mac-M1 (ARM) devices, we are using docker right now (to host a database supporting transactional queries).
First install docker. (https://docs.docker.com/desktop/install/mac-install/)
Run the docker container
```bash
docker run --cap-add SYS_PTRACE -e 'ACCEPT_EULA=1' -e 'MSSQL_SA_PASSWORD=yourStrong(!)Password' -p 1433:1433 --name azuresqledge -d mcr.microsoft.com/azure-sql-edge
```
Afterwards you can start the project using
- the Visual Studio run button
- F5 in visual studio code
- Or execute the npm commands by hand (npm run server && npm start)

### Check the Swagger API

To take a look at the swagger api, you need to start the project from `Visual Studio` right now, NOT VSCode.
Than you will be able to browse the api unter the URL https://localhost:5001/api/index.html?url=/api/specification.json#/

## Tailwind

[Cheatsheet](https://tailwindcomponents.com/cheatsheet/)

We decided to use tailwind (instead of bootstrap) because its:
- more flexible and smaller
- recommend for webapps (while bootstrap has its advantages on websites)
- we have designers, so we need to build our own themes anyway
