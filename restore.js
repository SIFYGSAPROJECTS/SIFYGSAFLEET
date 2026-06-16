const fs = require('fs');
const { execSync } = require('child_process');

const files = [
  'app/dashboard/inventario/page.tsx',
  'app/verificaciones/page.tsx',
  'app/dashboard/usuarios/UsuariosTabs.tsx',
  'app/computo/servicios/ServiciosComputoTabs.tsx',
  'app/dashboard/servicios/ServiciosTabs.tsx',
  'app/dashboard/costos/page.tsx',
  'app/dashboard/checklists/ChecklistsClient.tsx',
  'app/dashboard/documentos/DocumentosClient.tsx',
  'app/computo/documentos/DocumentosComputoClient.tsx',
  'app/dashboard/mis-checklists/page.tsx',
  'app/dashboard/mis-documentos/page.tsx'
];

for (const file of files) {
  try {
    let currentContent = fs.readFileSync(file, 'utf8');
    let gitContent = execSync('git show HEAD:' + file, {encoding: 'utf8'});

    let match = gitContent.match(/(?:<div className=\"flex flex-col sm:flex-row items-center justify-center lg:justify-end[^>]*>\s*)?<div className=\"w-full[^>]*overflow-x-auto scrollbar-hide[^>]*>[\s\S]*?shadow-lg shrink-0 gap-1[\s\S]*?<\/div>\s*<\/div>\s*<\/div>(?:\s*<\/div>)?/);
    
    if (match) {
      let pillBlock = match[0];
      let inserted = false;
      
      currentContent = currentContent.replace(
        /(<div className=\"flex flex-col[^>]*justify-between[^>]*mb-(?:8|2|10)\">\s*(?:\{\/\*.*?\*\/\}\s*)?)(<\/div>)/, 
        (m, p1, p2) => {
           inserted = true;
           return p1 + '\n' + pillBlock + '\n' + p2;
        }
      );
      
      if (!inserted) {
        currentContent = currentContent.replace(
          /(\{\/\* TEXTO ALINEADO A LA IZQUIERDA \*\/\}\s*<\/div>\s*)(<\/div>)/,
          (m, p1, p2) => {
            inserted = true;
            return p1 + '\n' + pillBlock + '\n' + p2;
          }
        );
      }
      
      if (!inserted && file.includes('UsuariosTabs')) {
          currentContent = currentContent.replace(
            /(<div className=\"flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8\">\s*\{\/\* TEXTO ALINEADO A LA IZQUIERDA \*\/\}\s*)/,
            (m, p1) => {
              inserted = true;
              return p1 + '\n' + pillBlock + '\n';
            }
          );
      }

      if (!inserted && file.includes('mis-documentos')) {
          currentContent = currentContent.replace(
            /(<div className=\"p-4 sm:p-8 max-w-5xl mx-auto\">\s*)(<!-- ESTADO DE CARGA -->|\{cargando \? \()/,
            (m, p1, p2) => {
              inserted = true;
              return p1 + '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-10">\n' + pillBlock + '\n</div>\n' + p2;
            }
          );
      }
      
      if (!inserted && file.includes('mis-documentos')) {
         currentContent = currentContent.replace(
            /(<div className=\"p-4 sm:p-8 max-w-5xl mx-auto\">\s*)/,
            (m, p1) => {
              inserted = true;
              return p1 + '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-10">\n' + pillBlock + '\n</div>\n';
            }
          );
      }

      if (inserted) {
        fs.writeFileSync(file, currentContent);
        console.log('Restored in ' + file);
      } else {
        console.log('Could not find where to insert in ' + file);
      }
    } else {
      console.log('Could not find pill block in git HEAD for ' + file);
    }
  } catch (e) {
    console.log('Error processing ' + file + ': ' + e.message);
  }
}
