import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface EquipoComputoPDF {
  C_Interno: string;
  Empresa: string | null;
  Tipo: string | null;
  Marca: string | null;
  Modelo: string | null;
  Service_Tag: string | null;
  Cargador: string | null;
  Usuario: string | null;
  Departamento: string | null;
  Puesto_Proyecto: string | null;
  N_EMP: string | null;
  Estatus: string | null;
  CR: string | null;
  Fecha_CR: string | null;
  Proveedor: string | null;
}

export const generarCartaResponsiva = async (equipo: EquipoComputoPDF) => {
  const doc = new jsPDF();
  
  // Función helper para cargar imagen a base64
  const cargarImagenBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  // Determinar el proveedor para seleccionar la plantilla
  const proveedor = (equipo.Proveedor || '').toUpperCase();
  const esVipsa = proveedor.includes('VIPSA');
  
  // Intentar cargar el logo
  const logoUrl = esVipsa ? '/logos/vipsa-logo.jpg' : '/logos/arrendadora-logo.jpg';
  const logoBase64 = await cargarImagenBase64(logoUrl);

  // Fuentes y colores estándar
  doc.setFont('helvetica');

  // --- CABECERA ---
  if (esVipsa) {
    if (logoBase64) {
      // Si el logo de VIPSA es ancho, le damos más espacio
      doc.addImage(logoBase64, 'JPEG', 20, 15, 50, 20, undefined, 'FAST');
    } else {
      // Texto del Logo de VIPSA (Placeholder si no hay imagen)
      doc.setFontSize(24);
      doc.setTextColor(112, 168, 224); // Azul VIPSA
      doc.setFont('helvetica', 'bold');
      doc.text('VIPSA', 20, 25);
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('SOLUCIONES INTEGRALES\nS.A. DE C.V.', 20, 32);
    }

    // Dirección VIPSA
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Mariano Matamoros N° 11\nColonia Centro 96700\nMinatitlán, Veracruz, México\nTel. +52 (922) 224 1996, 223 9760\nwww.vipsamx.com || vipsa@vipsamx.com', 190, 20, { align: 'right' });
    
    // Línea separadora azul
    doc.setDrawColor(112, 168, 224);
    doc.setLineWidth(0.5);
    doc.line(20, 42, 190, 42);
  } else {
    // ARRENDADORA (Default)
    if (logoBase64) {
      // El logo AH es más cuadrado, ajustamos el ancho a 45 para que no choque con el texto
      doc.addImage(logoBase64, 'JPEG', 20, 12, 45, 23, undefined, 'FAST');
    } else {
      doc.setFontSize(24);
      doc.setTextColor(112, 168, 224); // Azul
      doc.setFont('helvetica', 'bold');
      doc.text('AH', 20, 25);
    }
    
    doc.setFontSize(20);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    // Movemos el texto un poco más a la derecha (90) para asegurar que no se encime al logo
    doc.text('Arrendadora de Vehículos\ny Herramientas', 85, 20);

    // Línea separadora azul
    doc.setDrawColor(112, 168, 224);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
  }

  // --- TÍTULO ---
  const startY = esVipsa ? 55 : 50;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('CARTA RESPONSIVA DE EQUIPO DE CÓMPUTO', 105, startY, { align: 'center' });

  // --- PÁRRAFO INTRODUCTORIO ---
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const textoIntro = 'Por medio de la presente quien suscribe, declara recibir como herramienta de trabajo el equipo detallado en el primer punto. Mismo que firma de conformidad, comprometiéndose a mantenerlo en buen estado, cuidando de dicho equipo como si el mismo fuera de su propiedad, en el entendido de que en caso de que el mismo sufra cualquier daño ocasionado por su dolo o negligencia se hará responsable de la reparación del mismo.';
  
  const introLineas = doc.splitTextToSize(textoIntro, 170);
  doc.text(introLineas, 20, startY + 10);

  const introHeight = introLineas.length * 4.5;
  let currentY = startY + 8 + introHeight + 4;

  // --- LISTA PUNTO 1 ---
  const textoPunto1 = esVipsa 
    ? '1.  Recibí un nuevo equipo para el desempeño de las funciones para lo que fue contratado(a), con las siguientes características (se anexa factura del equipo).'
    : '1.  Recibí un equipo para el desempeño de las funciones para lo que fue contratado(a), con las características siguientes:';
  
  const punto1Lineas = doc.splitTextToSize(textoPunto1, 160);
  doc.text(punto1Lineas, 25, currentY);
  currentY += (punto1Lineas.length * 4.5) + 2;

  // --- TABLA DE EQUIPO ---
  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'TIPO:', 'MARCA:', 'MODELO:', 'SERVICE TAG:', 'No. DE CARGADOR:']],
    body: [
      [
        equipo.C_Interno || '',
        equipo.Tipo || '',
        equipo.Marca || '',
        equipo.Modelo || '',
        equipo.Service_Tag || '',
        equipo.Cargador || ''
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: esVipsa ? [24, 49, 83] : [24, 49, 83], // Color azul oscuro para ambas
      textColor: 255,
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      textColor: 0
    },
    margin: { left: 20, right: 20 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // --- LISTA RESTANTE (REGLAS) ---
  const reglasVipsa = [
    'Es su responsabilidad tomar las precauciones necesarias en el cuidado del equipo contra el sol, agua, polvo, humedad, temperatura y cualquier otro factor que puedan dañar al equipo.',
    'Se compromete a tomar como medida precautoria no manejar o beber líquidos, ni comer cerca del equipo de cómputo.',
    'Conectar el equipo de cómputo a una línea eléctrica regulada, cuando así lo requiera.',
    'Tiene prohibido intervenir y/o desarmar el equipo de cómputo, siendo el único responsable el área de Sistemas de la empresa.',
    'Es su responsabilidad mantener un respaldo de su información, así como del traslado y reubicación del equipo de cómputo.',
    'El equipo sólo podrá ser utilizado para cumplir con las tareas que le encomiende la empresa y la capacidad de almacenamiento del equipo de cómputo será utilizada para la información referente a su trabajo corporativo.',
    'En caso de robo o extravío el usuario estará obligado a reponer el costo que implica la pérdida del equipo.',
    'Reconoce que los derechos sobre el equipo objeto de la presente corresponden exclusivamente a VIPSA Soluciones Integrales S.A. de C.V., por lo que a la simple solicitud de la empresa se obliga a devolver el equipo que se le entrega a la firma del presente y, en todo caso, al terminar la relación laboral con la compañía dejara de utilizar el mismo haciendo entrega de él al personal que se le indique en el mismo estado en que lo haya recibido, salvo el deterioro debido al uso normal del equipo.'
  ];

  const reglasArrendadora = [
    'Es su responsabilidad tomar las precauciones necesarias en el cuidado del equipo contra el sol, agua, polvo, humedad, temperatura y cualquier otro factor que puedan dañar al equipo.',
    'Tiene prohibido intervenir y/o desarmar el equipo, siendo el único responsable el área de infraestructura.',
    'El equipo sólo podrá ser utilizado para uso exclusivo del desempeño de las actividades laborales asignadas.',
    'En caso de robo o extravío el usuario está obligado a reponer el costo que implique la pérdida del equipo.',
    'Reconoce que los derechos sobre el equipo objeto de la presente corresponden exclusivamente a Arrendadora de Vehículos y Herramientas S.A. de C.V., por lo que a la simple solicitud de la empresa se obliga a devolver el equipo que se le entrega a la firma del presente y, en todo caso, al terminar la relación laboral con la compañía dejara de utilizar el mismo haciendo entrega de él al personal que se le indique en el mismo estado en que lo haya recibido, salvo el deterioro debido al uso normal del equipo.'
  ];

  const reglas = esVipsa ? reglasVipsa : reglasArrendadora;

  doc.setFontSize(8.5);
  reglas.forEach((regla, index) => {
    const num = index + 2; // Empieza en 2 porque el punto 1 fue la tabla
    const textLines = doc.splitTextToSize(`${num}.  ${regla}`, 160);
    doc.text(textLines, 25, currentY);
    currentY += (textLines.length * 4) + 1.5;
  });

  // --- FIRMA Y FECHA ---
  // Si currentY es muy abajo, agregamos una página nueva para la firma
  if (currentY > 250) {
    doc.addPage();
    currentY = 40;
  } else {
    // Empujamos la firma hacia abajo para aprovechar el espacio en blanco (mínimo en Y=225)
    currentY = Math.max(currentY + 20, 225);
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Nombre y firma de conformidad', 20, currentY);
  
  currentY += 15;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(20, currentY, 100, currentY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(equipo.Usuario || '_______________________________', 20, currentY + 5);
  if (equipo.Departamento) {
    doc.setFontSize(8);
    doc.text(equipo.Departamento, 20, currentY + 9);
    doc.setFontSize(9);
  }

  // Fecha actual
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const hoy = new Date();
  const fechaStr = `Minatitlán, Ver., ${hoy.getDate().toString().padStart(2, '0')} de ${meses[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  
  doc.text(fechaStr, 190, currentY + 5, { align: 'right' });

  // --- FOOTER VIPSA ---
  if (esVipsa) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(112, 168, 224);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const footerText = 'Blvd. Leandro Rovirosa Wade 508    Natación 310                              Calle N° 3                                  Monte Albán 14\nBuena Vista 86357                        Unidad Deportiva 86189              Colonia Nueva Era 94295           Colonia Petrolera 70620\nComalcalco, Tabasco                    Villahermosa, Tabasco                Boca del Río, Veracruz               Salina Cruz, Oaxaca.\nTel. +52 (933) 334 1128                Tel. +52 (993) 351 4443              Tel. +52 (229) 260 1492';
    doc.text(footerText, 20, pageHeight - 25);
  } else {
    // Footer Arrendadora
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(112, 168, 224);
    doc.line(20, pageHeight - 30, 190, pageHeight - 30);
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Calle 37 A, N° 1\nColonia Paseo de las Fuentes\nC.P. 97225\nMérida, Yucatán', 20, pageHeight - 25);
  }

  // --- DESCARGAR ---
  const fileName = `Carta_Responsiva_${equipo.C_Interno || 'Equipo'}.pdf`;
  doc.save(fileName);
};
