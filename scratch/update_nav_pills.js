const fs = require('fs');
const path = require('path');

const targetFiles = [
  'app/dashboard/usuarios/UsuariosTabs.tsx',
  'app/dashboard/inventario/page.tsx',
  'app/dashboard/servicios/ServiciosTabs.tsx',
  'app/dashboard/mis-documentos/page.tsx',
  'app/dashboard/documentos/DocumentosClient.tsx',
  'app/dashboard/mis-checklists/page.tsx',
  'app/dashboard/checklists/ChecklistsClient.tsx',
  'app/dashboard/costos/page.tsx'
];

const newLink = `                  <Link href="/verificaciones" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-green-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <CalendarCheck size={14} /> Verificaciones
                  </Link>`;

targetFiles.forEach(relPath => {
  const filePath = path.join('c:/Users/AVH-COM-330/Documents/SIFYGSA_PROJET', relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add CalendarCheck to lucide-react imports if it's missing
    if (content.includes('lucide-react') && !content.includes('CalendarCheck')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"];/, (match, p1) => {
        return `import {${p1}, CalendarCheck } from 'lucide-react';`;
      });
    }

    // Insert the new Link before the closing tag of the pill div.
    // The pill div always has: <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
    // We can look for the closing </div> of that pill, or we can look for `</Link>` of Documentos or Costos and insert it.
    // However, the active tab varies per file (e.g. in Costos it's a <div ...>Costos</div>).
    // A reliable way is to find `<FolderOpen size={14} /> Documentos` and insert after its closing tag.
    // Wait, some pages might be Costos so Costos is after Documentos. Let's just find the closing </div> of the inline-flex.
    
    // Let's use regex to find the `inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1` div.
    const pillRegex = /(<div className="inline-flex items-center bg-\[var\(--bg-floating\)\] border border-\[var\(--border-cream\)\] rounded-full p-1\.5 shadow-lg shrink-0 gap-1">[\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>|<\/div>\s*<\/div>\s*<div)/;

    // Actually, looking at the Costos code:
    /*
                  <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                    <DollarSign size={14} className="text-emerald-500" /> Costos
                  </div>
                </div>
              </div>
            </div>
    */
    // We can just find the string `                </div>` that closes the pill.
    // Or simpler: find `Costos` link or div, and insert after it.
    // Let's replace the last item of the pill.
    const costosLinkStr = `Costos\n                  </Link>`;
    const costosDivStr = `Costos\n                  </div>`;
    
    if (content.includes(costosLinkStr)) {
        content = content.replace(costosLinkStr, costosLinkStr + '\n' + newLink);
    } else if (content.includes(costosDivStr)) {
        content = content.replace(costosDivStr, costosDivStr + '\n' + newLink);
    } else {
        // If neither, just append after Documentos
        const docLinkStr = `Documentos\n                  </Link>`;
        const docDivStr = `Documentos\n                  </div>`;
        if (content.includes(docLinkStr)) {
            content = content.replace(docLinkStr, docLinkStr + '\n' + newLink);
        } else if (content.includes(docDivStr)) {
            content = content.replace(docDivStr, docDivStr + '\n' + newLink);
        } else {
            console.log("Could not find insertion point in", relPath);
        }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated", relPath);
  } else {
    console.log("Not found:", relPath);
  }
});
