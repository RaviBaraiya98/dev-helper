const BaseDetector = require('./base');
const { fileExists, readFile, directoryExists, commandExists, getCommandVersion, listFiles } = require('../utils/runner');
const { extractVersion } = require('../utils/version');

class DotNetDetector extends BaseDetector {
  constructor() {
    super();
    this.name = '.NET';
    this.type = 'dotnet';
    this.configFiles = ['.csproj', '.fsproj', '.sln'];
    this.runtimeCommand = 'dotnet';
  }

  detect(dir) {
    const files = listFiles(dir);
    return files.some(f => 
      f.endsWith('.csproj') || 
      f.endsWith('.fsproj') || 
      f.endsWith('.vbproj') ||
      f.endsWith('.sln')
    );
  }

  analyze(dir) {
    const files = listFiles(dir);
    const projectFiles = files.filter(f => 
      f.endsWith('.csproj') || f.endsWith('.fsproj') || f.endsWith('.vbproj')
    );
    const solutionFiles = files.filter(f => f.endsWith('.sln'));

    return {
      detected: true,
      name: this.name,
      type: this.type,
      projectFiles: projectFiles,
      solutionFiles: solutionFiles,
      language: this.detectLanguage(projectFiles),
      framework: this.detectFramework(dir, projectFiles),
      hasBin: directoryExists('bin', dir),
      hasObj: directoryExists('obj', dir)
    };
  }

  detectLanguage(projectFiles) {
    if (projectFiles.some(f => f.endsWith('.csproj'))) return 'C#';
    if (projectFiles.some(f => f.endsWith('.fsproj'))) return 'F#';
    if (projectFiles.some(f => f.endsWith('.vbproj'))) return 'VB.NET';
    return 'unknown';
  }

  detectFramework(dir, projectFiles) {
    for (const pf of projectFiles) {
      const content = readFile(pf, dir) || '';
      if (content.includes('Microsoft.AspNetCore')) return 'ASP.NET Core';
      if (content.includes('Microsoft.NET.Sdk.Web')) return 'ASP.NET Core';
      if (content.includes('Microsoft.NET.Sdk.BlazorWebAssembly')) return 'Blazor WebAssembly';
      if (content.includes('Microsoft.NET.Sdk.Razor')) return 'Blazor';
      if (content.includes('Microsoft.Maui')) return '.NET MAUI';
      if (content.includes('Xamarin')) return 'Xamarin';
      if (content.includes('Microsoft.NET.Sdk.Worker')) return 'Worker Service';
    }
    return null;
  }

  getChecks() {
    return [
      {
        id: 'dotnet-installed',
        name: '.NET SDK installed',
        check: () => commandExists('dotnet'),
        getVersion: () => {
          const output = getCommandVersion('dotnet');
          return extractVersion(output);
        },
        fix: 'Install .NET SDK from https://dotnet.microsoft.com/download'
      },
      {
        id: 'dependencies-restored',
        name: 'Dependencies restored',
        check: (dir) => directoryExists('obj', dir),
        fix: 'dotnet restore'
      },
      {
        id: 'project-built',
        name: 'Project compiled',
        check: (dir) => directoryExists('bin', dir),
        fix: 'dotnet build'
      }
    ];
  }
}

module.exports = DotNetDetector;
