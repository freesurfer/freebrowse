# FreeBrowse

This document will guide you through the steps to install FreeBrowse locally and then deploy it to Azure.

## Installing Locally:

### 1. **Prerequisites**:
   - [Node.js](https://nodejs.org/en/download/) v20.x
   - [.NET Core SDK](https://dotnet.microsoft.com/download/dotnet-core) v7.0.x; do not use dotnet v8!
   - [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) 2022; v16.0.x
   - [Microsoft SQL Server Command line tools](https://learn.microsoft.com/en-us/sql/tools/sqlcmd/sqlcmd-utility) (optional)
   
#### Ubuntu 20.04 dev quickstart:

Setup for node v20.x
```
sudo apt-get update
sudo apt-get install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

Setup for Microsoft SQL Server:
```
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2022.list)"
sudo apt-get install -y mssql-server
```

Setup for .NET Core SDK 7.0.x (do not use v8!)
```
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
```

Install:
  - node v20.x
  - .NET Core SDK 7.0.x
  - Microsoft SQL Serverv 2022 (16.0.x)
```
sudo apt-get install -y nodejs dotnet-sdk-7.0 mssql-server
```

Setup and install Microsoft SQL Server Command line tools (optional):
```
curl https://packages.microsoft.com/keys/microsoft.asc | sudo tee /etc/apt/trusted.gpg.d/microsoft.asc
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list
sudo apt-get update
sudo apt-get install mssql-tools18 unixodbc-dev
```

References:
  - [Install .NET SDK or .NET Runtime on Ubuntu](https://learn.microsoft.com/en-us/dotnet/core/install/linux-ubuntu-install?pivots=os-linux-ubuntu-2004&tabs=dotnet8)
  - [Quickstart: Install SQL Server and create a database on Ubuntu](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-ubuntu?view=sql-server-ver16&tabs=ubuntu2004)
  - [Install the SQL Server command-line tools](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-ubuntu?view=sql-server-ver16&tabs=ubuntu2004#tools)
  
### 2. **Clone the Repository**:

```
git clone git@github.com:freesurfer/freebrowse.git
cd freebrowse
```

### 3. **Install Node Dependencies**:
Navigate to the client-side directory, which is called `ClientApp`:

```
cd src/WebUI/ClientApp/
npm install
```

### 4. **Set Up the Database**:
- Open SQL Server Management Studio (SSMS).
- Connect to your SQL Server instance.
- Set the SQL server admin password

#### Ubuntu 20.04 dev quickstart:
```
sudo /opt/mssql/bin/mssql-conf setup
```
- Select #2, Developer edition
- Enter the SQL Server system administrator password
- Update [`appsettings.json`](src/WebUI/appsettings.json) accordingly.  It defaults to local development settings with a SQL Server system administrator password of `paul!!!12345`

### 5. **Run the Application**:
Navigate back to the top level of the application and run:

```
cd src/WebUI
dotnet run
```

The backend server will run on `http://localhost:5001`
The client-side app will run on `http://localhost:44444`
Open your browser and go to `http://localhost:44444` to view the application.

---

## Local and Blob Storage for Files

In the `appsettings.json` file, there is a configuration named `UseLocalStorage`. This setting determines where the application saves files.

- If `UseLocalStorage` is set to `true`, the application will save files on the local machine.
- If `UseLocalStorage` is set to `false`, the application will store files in Azure Blob Storage. Ensure that you've correctly [set up and configured Azure Blob Storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-create?tabs=azure-portal) in your application and provided necessary connection strings.

Ensure to choose the appropriate storage method depending on your application's needs and deployment scenarios.

---

## Tools and Development Environment

### IDEs and Code Editors
- [Visual Studio](https://visualstudio.microsoft.com/): Preferred for .NET development.
- [Visual Studio Code](https://code.visualstudio.com/): Lightweight editor suitable for JavaScript development.
- [SQL Server Management Studio (SSMS)](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms): For managing and querying SQL Server databases.

### Debugging Tools
- Built-in debugging in [Visual Studio](https://learn.microsoft.com/en-us/visualstudio/debugger/debugger-feature-tour?view=vs-2022) of [Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging): Utilize breakpoints, watch variables, inspect the call stack.
- [Browser Developer Tools](https://developer.chrome.com/docs/devtools/): For client-side debugging.

## Development Workflow
1. Clone the Repository: Get the latest codebase from the repository.
2. Branching: Create feature or bug-fix branches.
3. Development: Make changes using the recommended IDEs.
5. Code Review: Submit pull requests and have peer reviews.
6. Merge and Deploy: Merge into the main branch and deploy to the desired environment.

## Managing Services

### To Start Services
\`\`\`bash
dotnet run
\`\`\`

### To Stop Services
Press `Ctrl + C` in the terminal where the service is running.

### To Restart Services
Stop the service as above and start it again using `dotnet run`.

### To Debug Services
Use the debugging tools in the IDE, setting breakpoints and watching variables as needed.

## Repositories
- FreeBrowse: Main application repository, including the backend and client app.
- Niivue.Fork: Contains the our version of the niivue package

## Compilation

Note: You don't have to build the frontend project every time you make changes to it. Simply refresh your browser to see the updates.

1. Frontend:
   \`\`\`bash
   cd src/WebUI/ClientApp
   npm run build
   \`\`\`

2. Backend:
   \`\`\`bash
   cd src/WebUI
   dotnet build
   \`\`\`

3. Typescript (v5.x.x)
   \`\`\`bash
   src/WebUI/ClientApp
   npx tsc
   \`\`\`

4. Prettier (to fix linting errors)
   \`\`\`bash
   npx prettier --write src/to/file/ThrowingLintingErrors.ts
   \`\`\`

---

## Jupyter Notebook with ipyniivue

### 1. **Prerequisites**:
- Installed [local Jupyter Notebook](https://jupyter.org/) or access to [online Jupyter Notebook instance](https://anthonyandroulakis.github.io/ipyNiiVueLite/lab/?path=introduction.ipynb)

### 2. **Open Jupyter Notebook**:
- Start Jupyter Notebook locally:
  ```
  jupyter notebook
  ```
or
- Navigate to the online instance

### 3. **Jupyter Notebook Demos**:
Demos and more information on how to use ipyniivue can be found 
- on [GitHub](https://github.com/niivue/ipyniivue)
- [Demo files](ipyniivueDemos/)

---

## Deploying to Azure:

### 1. **Prerequisites**:
- An active [Azure account](https://portal.azure.com/)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed

### 2. **Create a SQL Database in Azure**:
- Go to the Azure portal.
- Create a new SQL database and configure the firewall settings to allow connections.
- Note down the connection string.

### 3. **Update Connection Strings for Production**:
Update the production section of `appsettings.json` or use Azure's Application Settings for your app service to override the connection string with the one from your Azure SQL database.

### 4. **Publishing the Application**:
In your terminal or command prompt, from the project directory:
dotnet publish -c Release

### 5. **Deploying to Azure App Service**:
- First, log in to Azure CLI:
  ```
  az login
  ```

- Create a resource group:
  ```
  az group create --name <your-resource-group-name> --location <preferred-location>
  ```

- Create an Azure App Service plan:
  ```
  az appservice plan create --name <your-app-service-plan-name> --resource-group <your-resource-group-name> --sku B1 --is-linux
  ```

- Create a web app:
  ```
  az webapp create --resource-group <your-resource-group-name> --plan <your-app-service-plan-name> --name <your-app-name> --runtime "DOTNET|5.0" --deployment-local-git
  ```

- Set up local git deployment:
  ```
  az webapp deployment user set --user-name <username> --password <password>
  ```

- Push to Azure from your local git:
  ```
  git remote add azure <deployment-local-git-url-from-previous-step>
  git push azure master
  ```

### 6. **Navigate to Your App**:
Go to `https://<your-app-name>.azurewebsites.net` in your browser.
