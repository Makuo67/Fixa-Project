## Installation Instructions 
 
Before proceeding with the installation of the Admin Panel, ensure that you have the following prerequisites installed on your computer: 
- [Node.js 16.16.0 or later](https://nodejs.org/en/) 
- Supported operating systems: macOS, Windows (including WSL), and Linux 
 
Once you have the prerequisites installed, you can follow the steps below to install and run the Admin Panel: 
 
1. Navigate to the project directory:
```bash
cd admin_panel
```

2. Install the project dependencies:
```bash
npm install --legacy-peer-deps
```

3. Copy the ```.env.example```  file to  ```.env``` :
```bash
cp .env.example .env
```
>Reach out to the project owners or maintainers for the collect environment variables

4. Start the development server:
```bash
npm run dev
```

5. Open your web browser and visit [http://localhost:3000](http://localhost:3000) to view the Admin Panel application. 
 
