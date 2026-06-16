const fs = require('fs');
const files = [
  'app/verificaciones/page.tsx',
  'app/dashboard/usuarios/UsuariosTabs.tsx',
  'app/dashboard/checklists/ChecklistsClient.tsx',
  'app/dashboard/seguimiento/page.tsx',
  'app/dashboard/mis-checklists/page.tsx',
  'app/dashboard/mis-documentos/page.tsx',
  'app/dashboard/documentos/DocumentosClient.tsx'
];

files.forEach(f => {
  try {
    let content = fs.readFileSync(f, 'utf8');
    
    // We want to match: <div className="flex-1 flex flex-col items-start w-full text-left"> ... </div>
    // where inside it contains "Volver al Panel Principal".
    // This regex looks for the div and everything inside until the first </div>
    let newContent = content.replace(/<div className="flex-1 flex flex-col items-start w-full text-left">[\s\S]*?Volver al Panel Principal[\s\S]*?<\/div>/g, '');
    
    // If there were any leftover empty lines from the removal, maybe trim them, but it's fine.
    
    if (newContent !== content) {
      fs.writeFileSync(f, newContent);
      console.log('Updated ' + f);
    } else {
      console.log('No match found in ' + f);
    }
  } catch (e) {
    console.error('Error with ' + f + ':', e.message);
  }
});
