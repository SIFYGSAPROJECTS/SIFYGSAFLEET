const fs = require('fs');
const { execSync } = require('child_process');

const files = [
  'app/dashboard/inventario/page.tsx',
  'app/verificaciones/page.tsx',
  'app/computo/servicios/ServiciosComputoTabs.tsx',
  'app/dashboard/costos/page.tsx',
  'app/computo/documentos/DocumentosComputoClient.tsx'
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
        /(<div className=\"flex flex-col (?:md|lg):flex-row justify-between (?:lg|md):items-center gap-5 mb-(?:2|8)\">\s*<\/div>)/, 
        (m, p1) => {
           inserted = true;
           return '<div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8\">\n' + pillBlock + '\n</div>';
        }
      );

      if(!inserted && file.includes('inventario')) {
         currentContent = currentContent.replace(
           /<div className=\"flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-2\">\s*<\/div>/,
           (m) => {
             inserted = true;
             return '<div className=\"flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-2\">\n' + pillBlock + '\n</div>';
           }
         );
      }

      if(!inserted && file.includes('costos')) {
         currentContent = currentContent.replace(
           /<div className=\"flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-2\">\s*<\/div>/,
           (m) => {
             inserted = true;
             return '<div className=\"flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-2\">\n' + pillBlock + '\n</div>';
           }
         );
      }

      if(!inserted && file.includes('verificaciones')) {
         currentContent = currentContent.replace(
           /<div className=\"flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8\">\s*<\/div>/,
           (m) => {
             inserted = true;
             return '<div className=\"flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8\">\n' + pillBlock + '\n</div>';
           }
         );
      }

      if(!inserted && file.includes('ServiciosComputoTabs')) {
         currentContent = currentContent.replace(
           /<div className=\"flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8\">\s*<\/div>/,
           (m) => {
             inserted = true;
             return '<div className=\"flex flex-col md:flex-row justify-between md:items-center gap-5 mb-8\">\n' + pillBlock + '\n</div>';
           }
         );
      }

      if(!inserted && file.includes('DocumentosComputoClient')) {
         currentContent = currentContent.replace(
           /(<div className=\"flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8\">\s*<div className=\"flex-1 flex flex-col items-start w-full text-left\">[\s\S]*?<\/div>\s*<\/div>)/,
           (m) => {
             inserted = true;
             return m.replace('</div>\n\n        </div>', '</div>\n\n' + pillBlock + '\n        </div>');
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
