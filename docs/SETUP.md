# FreeBrowse

This document will guide you through the steps to install FreeBrowse locally and then deploy it to Azure.

## Installing Locally:

### 1. **Prerequisites**:
   - [Node.js](https://nodejs.org/en/download/)
   - [.NET Core SDK](https://dotnet.microsoft.com/download/dotnet-core)
   - [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)

### 2. **Clone the Repository**:
git clone https://gv-grip@dev.azure.com/gv-grip/FreeBrowse/_git/FreeBrowse
cd .\FreeBrowse

### 3. **Install Node Dependencies**:
Navigate to the client-side directory, which is called `ClientApp`:
cd ClientApp
npm install

### 4. **Set Up the Database**:
- Open SQL Server Management Studio (SSMS).
- Connect to your SQL Server instance.

### 5. **Update Connection Strings**:
In the ASP.NET solution, find the `appsettings.json` file and update the SQL connection string with your local database details.

### 6. **Run the Application**:
Navigate back to the root directory of the application and run:
dotnet run

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