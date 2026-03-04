import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- 🧹 LIMPIEZA TOTAL DE TABLAS ---')
  // El orden es importante por las relaciones entre tablas
  await prisma.solicitud.deleteMany({})
  await prisma.inventario_Automoviles.deleteMany({})
  await prisma.empleados.deleteMany({})
  
  console.log('---  CREANDO ADMINISTRADORES ---')
  await prisma.empleados.createMany({
    data: [
      {
        Nombre_Empleado: "Mike",
        A_Paterno: "Mendez",
        Email: "mike.mendez2908@gmail.com",
        Rol: "ADMIN",
        Password: "123456" 
      },
      {
        Nombre_Empleado: "Alan",
        A_Paterno: "Montiel",
        Email: "coco42748@gmail.com", 
        Rol: "ADMIN",
        Password: "123456"
      }
    ]
  })

  console.log('---  INYECTANDO FLOTA SIFYGSA (94 UNIDADES) ---')
  await prisma.inventario_Automoviles.createMany({
    data: [
      // --- TABLA VSI ---
      { Consecutivo: 'VSI-011', Marca: 'Ford', Modelo: 'F-150', Linea: '2013', Color: 'Plata Estelar', Numero_Serie: '1FTEX1CM5DKD76015', Placa: 'XM6894A', Poliza_Seguro: 'AXA-150256535601', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'VSI-023', Marca: 'Ford', Modelo: 'Ranger', Linea: '2015', Color: 'Plata Metálico', Numero_Serie: '8AFBR5AA7F6270389', Placa: 'VT2279A', Poliza_Seguro: 'AXA - 140285021102', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'VSI-024', Marca: 'Ford', Modelo: 'Ranger', Linea: '2015', Color: 'Plata Metálico', Numero_Serie: '8AFBR5AA3F6276626', Placa: 'VT2280A', Poliza_Seguro: 'AXA - 130228565300', Email_encargado: null, Departamento: 'seguridad', Contrato: null, Ubicacion: 'comalcalco', Percance: null },
      { Consecutivo: 'VSI-028', Marca: 'Ford', Modelo: 'Ranger', Linea: '2015', Color: 'Blanco', Numero_Serie: '8AFBR5AA3F6289330', Placa: 'XY4793A', Poliza_Seguro: 'AXA - 140244589503', Email_encargado: null, Departamento: 'HSE', Contrato: 'SFG-C245-MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'VSI-029', Marca: 'Ford', Modelo: 'Ranger', Linea: '2015', Color: 'Blanco', Numero_Serie: '8AFBR5AA3F6287626', Placa: 'YH6813A', Poliza_Seguro: 'AXA - 140244592703', Email_encargado: null, Departamento: 'HSE', Contrato: '------', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'VSI-032', Marca: 'Nissan', Modelo: 'NP300', Linea: '2015', Color: 'Plata', Numero_Serie: '3N6DD25X6FK048155', Placa: 'YF0200A', Poliza_Seguro: 'AXA - 130245960301', Email_encargado: null, Departamento: 'COMPRAS', Contrato: null, Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'VSI-036', Marca: 'CRCC ISRAEL', Modelo: 'REMOLQUE', Linea: '2015', Color: 'BLANCO', Numero_Serie: '3C9BS1217FA196129', Placa: '1YA2485', Poliza_Seguro: 'AXA - 130256639800', Email_encargado: null, Departamento: 'Infraestrustura', Contrato: '------', Ubicacion: 'Minatitlan', Percance: null },

      // --- TABLA LOBO 2025 ---
      { Consecutivo: 'F&G-D01', Marca: 'Ford', Modelo: 'Lobo', Linea: '2025', Color: 'Blanco metalico', Numero_Serie: '1FTFW7LD1SFB51980', Placa: 'XU-0915-B', Poliza_Seguro: '160260875900', Email_encargado: null, Departamento: 'DG', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'F&G-D02', Marca: 'Ford', Modelo: 'Lobo', Linea: '2025', Color: 'Gris Carbono', Numero_Serie: '1FTFW7LD9SFB60488', Placa: 'XU-0916-B', Poliza_Seguro: '160260875800', Email_encargado: null, Departamento: 'DG', Contrato: null, Ubicacion: null, Percance: null },

      // --- TABLA F&G ---
      { Consecutivo: 'F&G-002', Marca: 'Ford', Modelo: 'F-150', Linea: '2016', Color: 'Blanco Oxford', Numero_Serie: '1FTEW1C80GFA26827', Placa: 'YG8491A', Poliza_Seguro: 'AXA - 150215848002', Email_encargado: null, Departamento: 'Directivo', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-003', Marca: 'Ford', Modelo: 'Ranger', Linea: '2017', Color: 'Blanco Oxford', Numero_Serie: '8AFWR5AA0H6403921', Placa: 'YH6853A', Poliza_Seguro: 'AXA - 150215856802', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: 'Comalcalco', Percance: 'Vendido' },
      { Consecutivo: 'F&G-004', Marca: 'Ford', Modelo: 'Figo Impulse', Linea: '2016', Color: 'Gris Hierro', Numero_Serie: 'MAJFP1MD3GA108311', Placa: 'YHG354B', Poliza_Seguro: 'AXA - 130252475801', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'F&G-005', Marca: 'Ford', Modelo: 'Figo Impulse', Linea: '2016', Color: 'Gris Hierro', Numero_Serie: 'MAJFP1MD9GA110032', Placa: 'YDP622B', Poliza_Seguro: 'AXA - 130252482001', Email_encargado: null, Departamento: 'Admon', Contrato: '------', Ubicacion: 'Minatitlán', Percance: null },
      { Consecutivo: 'F&G-006', Marca: 'Ford', Modelo: 'Figo Impulse', Linea: '2016', Color: 'Plata Estelar', Numero_Serie: 'MAJFP1MDXGA109486', Placa: 'YHG998B', Poliza_Seguro: 'AXA - 150215854702', Email_encargado: null, Departamento: 'HSE', Contrato: 'SFG-C245-MSA', Ubicacion: 'Minatitlán', Percance: null },
      { Consecutivo: 'F&G-007', Marca: 'Ford', Modelo: 'Figo Impulse', Linea: '2016', Color: 'Gris Hierro', Numero_Serie: 'MAJFP1MD9GA110385', Placa: 'YJW525A', Poliza_Seguro: 'AXA-150215853402', Email_encargado: null, Departamento: 'HSE', Contrato: 'SFG-C245-MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-008', Marca: 'Ford', Modelo: 'Figo Impulse', Linea: '2016', Color: 'Blanco Oxford', Numero_Serie: 'MAJFP1MD3GA111578', Placa: 'YGS294B', Poliza_Seguro: 'AXA -150215855602', Email_encargado: null, Departamento: 'Infraestructura', Contrato: 'Administrativo', Ubicacion: 'Minatitlán', Percance: null },
      { Consecutivo: 'F&G-009', Marca: 'Ford', Modelo: 'Edge', Linea: '2016', Color: 'Plata Estelar', Numero_Serie: '2FMPK3AP7GBB20484', Placa: 'YLM-991-A', Poliza_Seguro: 'AXA- 130252486101', Email_encargado: null, Departamento: 'Directivo', Contrato: null, Ubicacion: 'Minatitlán', Percance: 'Vendido' },
      { Consecutivo: 'F&G-011', Marca: 'Ford', Modelo: 'Transit', Linea: '2020', Color: 'Banco nieve', Numero_Serie: 'WF0SS4KH8LTH09744', Placa: 'YLN739A', Poliza_Seguro: 'AXA- 130243482601', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-012', Marca: 'Ford', Modelo: 'Transit', Linea: '2015', Color: 'Blanco', Numero_Serie: 'WF0SS4KV9FTB02732', Placa: 'YLN142A', Poliza_Seguro: 'AXA - 130288498100', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-013', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Gris Mercurio', Numero_Serie: 'AFAFR6CB1RP131237', Placa: 'XP0447B', Poliza_Seguro: 'AXA - 150276640001', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-015', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB7RP131176', Placa: 'XP0446B', Poliza_Seguro: 'AXA - 150276645700', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-016', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2024', Color: 'Blanco candy', Numero_Serie: 'WVW3J4D22RT021764', Placa: 'Z60BPL', Poliza_Seguro: 'AXA - 150276699800', Email_encargado: null, Departamento: 'VENTAS', Contrato: null, Ubicacion: null, Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-017', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2024', Color: 'Blanco Candy', Numero_Serie: 'WVW3J4D21RT028057', Placa: 'Z54BPL', Poliza_Seguro: 'AXA - 150276710200', Email_encargado: null, Departamento: 'VENTAS', Contrato: null, Ubicacion: 'Comalcalco', Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-018', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2024', Color: 'Blanco candy', Numero_Serie: 'WVW3J4D29RT027612', Placa: 'Z56BPL', Poliza_Seguro: 'AXA - 150276714201', Email_encargado: null, Departamento: 'VENTAS', Contrato: 'SFG-C259-LVT', Ubicacion: 'Veracruz', Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-019', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2024', Color: 'Blanco candy', Numero_Serie: 'WVW3J4D24RT032376', Placa: 'A11BPM', Poliza_Seguro: 'AXA - 150276705900', Email_encargado: null, Departamento: 'VENTAS', Contrato: null, Ubicacion: null, Percance: 'SOLUFI' },
      { Consecutivo: 'F&G-020', Marca: 'Ford', Modelo: 'Ranger', Linea: '2023', Color: 'ROJO CEREZA', Numero_Serie: 'AFAFR6CB8PP125366', Placa: 'XP0502B', Poliza_Seguro: null, Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'F&G-021', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB2RP135541', Placa: 'YH7798A', Poliza_Seguro: 'AXA -150296316300', Email_encargado: null, Departamento: 'HSE', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-022', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Plata', Numero_Serie: 'AFAFR6CB1RP135465', Placa: 'YH7799A', Poliza_Seguro: 'AXA- 150296324200', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'F&G-023', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CBXRP135495', Placa: 'XR3112B', Poliza_Seguro: 'AXA- 150296321300', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'F&G-024', Marca: 'Toyota', Modelo: 'Hilux', Linea: '2025', Color: 'A397294', Numero_Serie: 'MR0CX3DD6S1358192', Placa: 'XU0933B', Poliza_Seguro: 'AXA-160263300700', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'F&G-025', Marca: 'Toyota', Modelo: 'Hilux', Linea: '2025', Color: 'A397293', Numero_Serie: 'MR0CX3DD2S1360151', Placa: 'XU0934B', Poliza_Seguro: 'AXA- 160263304800', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'SFG-C197-MRC', Ubicacion: 'Cadereyta', Percance: null },
      { Consecutivo: 'F&G-026', Marca: 'Toyota', Modelo: 'Hilux', Linea: '2025', Color: 'A397295', Numero_Serie: 'MR0CX3DD6S1360167', Placa: 'XU0935B', Poliza_Seguro: 'AXA- 160263300600', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SFG-C183-MB2', Ubicacion: 'Braskem', Percance: null },
      { Consecutivo: 'F&G-027', Marca: 'Toyota', Modelo: 'Hilux', Linea: '2025', Color: null, Numero_Serie: 'MR0CX3DD4S1360149', Placa: 'XU0936B', Poliza_Seguro: 'AXA- 160263306200', Email_encargado: null, Departamento: 'HSE Comalcalco', Contrato: 'SFG-C259-LVT', Ubicacion: 'Veracruz', Percance: null },
      { Consecutivo: 'F&G-028', Marca: 'Toyota', Modelo: 'Hiace', Linea: '2026', Color: 'Blanca', Numero_Serie: 'JTFJM9CP2T6010270', Placa: 'NBM-785-C', Poliza_Seguro: 'AXA- 160263314100', Email_encargado: null, Departamento: null, Contrato: 'SFG-C251-CHN', Ubicacion: 'Chinameca', Percance: null },
      { Consecutivo: 'F&G-029', Marca: 'Toyota', Modelo: 'Hiace', Linea: '2026', Color: null, Numero_Serie: 'JTFJM9CP2T6010267', Placa: 'NBM-793-C', Poliza_Seguro: 'AXA-1602633296100', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'SFG-C197-MRC', Ubicacion: 'Cadereyta', Percance: null },

      // --- TABLA D-xxx ---
      { Consecutivo: 'D-001', Marca: 'chrysler', Modelo: 'Jepp', Linea: '2015', Color: 'Blanco brillante', Numero_Serie: '1C4BJWEG4FL573571', Placa: 'YDP601B', Poliza_Seguro: '150270985901', Email_encargado: null, Departamento: 'AAM', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'D-002', Marca: 'Ford', Modelo: 'Explorer', Linea: '2014', Color: 'Blanco platinado', Numero_Serie: '1FM5K7F83EGB13294', Placa: 'YDP782B', Poliza_Seguro: 'Vendida', Email_encargado: null, Departamento: 'Vendida', Contrato: 'Vendida', Ubicacion: 'Vendida', Percance: null },
      { Consecutivo: 'D-003', Marca: 'Volkswagen', Modelo: 'Amarok', Linea: '2021', Color: 'Plata pirita Met', Numero_Serie: '8AWDV22H9MA030897', Placa: 'XW8921A', Poliza_Seguro: null, Email_encargado: null, Departamento: 'Ventas', Contrato: 'vendio el ingeniero Manue', Ubicacion: null, Percance: null },
      { Consecutivo: 'D-004', Marca: 'BMW', Modelo: 'MINI COOPER', Linea: '2018', Color: 'ROJO', Numero_Serie: 'WMWYS910XJ3D86538', Placa: 'WPF034B', Poliza_Seguro: null, Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },

      // --- TABLA AVH ---
      { Consecutivo: 'AVH-001', Marca: 'Ford', Modelo: 'Edge Sport', Linea: '2017', Color: 'Plata Estelar', Numero_Serie: '2FMPK3AP0HBB01230', Placa: 'YLM-874-A', Poliza_Seguro: 'AXA - 130238282901', Email_encargado: null, Departamento: 'Directivo', Contrato: null, Ubicacion: 'Veracruz', Percance: 'Vendido' },
      { Consecutivo: 'AVH-002', Marca: 'Ford', Modelo: 'Ranger', Linea: '2017', Color: 'Plata Metalico', Numero_Serie: '8AFWR5AA8H6467706', Placa: 'XM6600A', Poliza_Seguro: 'AXA - 160251309400', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'PERENCO', Ubicacion: 'Comalcalco', Percance: 'Descompuesta' },
      { Consecutivo: 'AVH-004', Marca: 'Ford', Modelo: 'Figo EN', Linea: '2017', Color: 'Blanco Oxford', Numero_Serie: 'MAJFP1MD7HA130958', Placa: 'YLN107A', Poliza_Seguro: 'AXA- 130281335100', Email_encargado: null, Departamento: 'Ventas', Contrato: 'Administrativo', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-005', Marca: 'Ford', Modelo: 'Figo IM', Linea: '2017', Color: 'Plata Estelar', Numero_Serie: 'MAJFP1MD4HA131632', Placa: 'YJW058A', Poliza_Seguro: 'AXA - 140241689703', Email_encargado: null, Departamento: null, Contrato: 'Administrativo', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-008', Marca: 'Ford', Modelo: 'Lobo Lariat', Linea: '2017', Color: 'Plata Estelar', Numero_Serie: '1FTEW1EG5HFA38526', Placa: 'NEP-8779', Poliza_Seguro: 'AXA -120232751701', Email_encargado: null, Departamento: 'Directivo', Contrato: null, Ubicacion: 'CDMX', Percance: 'PRESTADA A CLIENTE' },
      { Consecutivo: 'AVH-009', Marca: 'ROMEX', Modelo: 'Oficina Movil', Linea: '2017', Color: 'Crema', Numero_Serie: '8324009', Placa: '1-PG-8900', Poliza_Seguro: 'MAPFRE - 35317000029', Email_encargado: null, Departamento: 'Infraestrustura', Contrato: '------', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-010', Marca: 'ROMEX', Modelo: 'Bodega movil', Linea: '2017', Color: 'Crema', Numero_Serie: '8325004', Placa: '1PG8901', Poliza_Seguro: 'MAPFRE - 35320000005', Email_encargado: null, Departamento: 'Infraestrustura', Contrato: '------', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-013', Marca: 'BMW', Modelo: 'Z-3', Linea: '1997', Color: 'BLANCO', Numero_Serie: '4USCJ3327VLC08632', Placa: 'YNU265B', Poliza_Seguro: 'AXA-120277598502', Email_encargado: null, Departamento: 'Directivo', Contrato: '------', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-015', Marca: 'Ford', Modelo: 'Figo EN', Linea: '2020', Color: 'Blanco Oxford', Numero_Serie: 'MAJFP1M18LA199320', Placa: 'YLN732A', Poliza_Seguro: 'AXA-130243515705', Email_encargado: null, Departamento: 'Ventas', Contrato: 'Administrativo', Ubicacion: 'Villahermosa', Percance: null },
      { Consecutivo: 'AVH-016', Marca: 'Ford', Modelo: 'Figo EN', Linea: '2020', Color: 'Gris Mercurio', Numero_Serie: 'MAJFP1M1LA198901', Placa: 'YLN733A', Poliza_Seguro: 'AXA-130244722306', Email_encargado: null, Departamento: 'Ventas', Contrato: 'Administrativo', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-018', Marca: 'Ford', Modelo: 'F-350', Linea: '2020', Color: 'Blanco Oxford', Numero_Serie: '1FDRF3G65LEC25583', Placa: 'XM6777A', Poliza_Seguro: 'AXA-130244718305', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-019', Marca: 'Ford', Modelo: 'Ranger XLT', Linea: '2020', Color: 'Blanco Nieve', Numero_Serie: 'AFAHR6CA4LP109434', Placa: 'XM6775A', Poliza_Seguro: 'AXA-130244714005', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-020', Marca: 'Ford', Modelo: 'Ranger XLT', Linea: '2020', Color: 'Blanco Nieve', Numero_Serie: 'AFAHR6CA1LP108791', Placa: 'XM-6776-A', Poliza_Seguro: 'AXA-130244720200', Email_encargado: null, Departamento: 'HSE', Contrato: 'MSA', Ubicacion: 'Comalcalco', Percance: 'Baja por perdida total' },
      { Consecutivo: 'AVH-021', Marca: 'Ford', Modelo: 'Ranger XL', Linea: '2020', Color: 'Blanco Nieve', Numero_Serie: 'AFAHR6CA7LP109881', Placa: 'XM6772A', Poliza_Seguro: 'AXA-130244709906', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-022', Marca: 'Ford', Modelo: 'Ranger XL', Linea: '2020', Color: 'Rojo Mexicano', Numero_Serie: 'AFAHR6CA3LP110428', Placa: 'XM6773A', Poliza_Seguro: 'AXA-130244722305', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: null, Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-023', Marca: 'Ford', Modelo: 'Ranger XL', Linea: '2020', Color: 'Azul relampago', Numero_Serie: 'AFAHR6CA5LP110429', Placa: 'XR6616A', Poliza_Seguro: 'AXA-160274850900', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'LIFTING', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-024', Marca: 'Ford', Modelo: 'F-150', Linea: '2019', Color: 'Blanco Oxford', Numero_Serie: '1FTEW1CB6KFD38915', Placa: 'XR6245A', Poliza_Seguro: 'AXA-140262082803', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'Administrativo', Ubicacion: 'Ventas', Percance: 'Descompuesta' },
      { Consecutivo: 'AVH-025', Marca: 'Ford', Modelo: 'F-150', Linea: '2019', Color: 'Blanco Oxford', Numero_Serie: '1FTEW1CBXKFD38917', Placa: 'XR6246A', Poliza_Seguro: 'AXA-140262084403', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'Administrativo', Ubicacion: 'Minatitlan', Percance: null },
      { Consecutivo: 'AVH-026', Marca: 'Nissan', Modelo: 'NP300', Linea: '2021', Color: 'Blanco', Numero_Serie: '3N6AD35A4MK813896', Placa: 'XW0747A', Poliza_Seguro: 'AXA-150269230101', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: 'DADA DE BAJA' },
      { Consecutivo: 'AVH-027', Marca: 'Ford', Modelo: 'Ranger Safr', Linea: '2021', Color: 'Blanco nieve', Numero_Serie: 'AFAHR6CA5MP117205', Placa: 'XW0749A', Poliza_Seguro: 'AFIRME', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SFG-C250', Ubicacion: null, Percance: 'DADA DE BAJA' },
      { Consecutivo: 'AVH-028', Marca: 'JAC', Modelo: 'Frison', Linea: '2022', Color: 'BLANCO', Numero_Serie: '3GA5D1543NM002429', Placa: 'XW8977A', Poliza_Seguro: 'AXA-140228893104', Email_encargado: null, Departamento: 'HSE', Contrato: 'SFG-C245-MSA', Ubicacion: 'Comalcalco', Percance: 'Dada de baja temporalmente' },
      { Consecutivo: 'AVH-029', Marca: 'MITSUBISHI', Modelo: 'L200', Linea: '2022', Color: 'white solid', Numero_Serie: 'MMBMLV5G5NH031775', Placa: 'XW8993A', Poliza_Seguro: 'AXA-140285014002', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'Administrativo', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-030', Marca: 'MITSUBISHI', Modelo: 'L200', Linea: '2022', Color: 'white solid', Numero_Serie: 'MMBMLV5G0NH014625', Placa: 'XW8996A', Poliza_Seguro: 'AXA-140233738400', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-031', Marca: 'CRCC ISRAEL', Modelo: 'REMOLQUE', Linea: '2017', Color: 'Blanco', Numero_Serie: '3C9BH1417HA196162', Placa: '1YA8752', Poliza_Seguro: 'AXA-140266413500', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-032', Marca: 'MITSUBISHI', Modelo: 'L200', Linea: '2022', Color: 'white solid', Numero_Serie: 'MMBNLV568NH060330', Placa: 'YJ6385A', Poliza_Seguro: 'AXA-140276628000', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SOLUFI', Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-033', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Negro aperlado', Numero_Serie: '8AF6R5AA7N6279125', Placa: 'YH6828A', Poliza_Seguro: 'AXA-140279933303', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-034', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Azul Relampago', Numero_Serie: 'AFAHR6CA9NP122151', Placa: 'YH6844A', Poliza_Seguro: 'AXA-140279931802', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-035', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Azul Relampago', Numero_Serie: 'AFAHR6CA9NP121890', Placa: 'YH6843A', Poliza_Seguro: 'AXA-140279927902', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-036', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Azul relampago', Numero_Serie: 'AFAHR6CA0NP122152', Placa: 'YH6845A', Poliza_Seguro: 'AXA-140279930102', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-037', Marca: 'Ford', Modelo: 'F-150', Linea: '2022', Color: 'Blanco Oxford', Numero_Serie: '1FTEW1CB5NKE14698', Placa: 'YH6862A', Poliza_Seguro: 'AXA-150228522601', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-038', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Blanco nieve', Numero_Serie: 'AFAHR6CAXNP122353', Placa: 'YH6888A', Poliza_Seguro: 'AXA-160252184100', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-039', Marca: 'Ford', Modelo: 'Ranger', Linea: '2022', Color: 'Blanco Nieve', Numero_Serie: 'AFAHR6CA0NP122328', Placa: 'YH6887A', Poliza_Seguro: 'AXA-160252194100', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'SFG-C197-MRC', Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-040', Marca: 'Ford', Modelo: 'Ranger SAFR', Linea: '2022', Color: 'Blanco nieve', Numero_Serie: 'AFAHR6CA8NP122271', Placa: 'XH5279B', Poliza_Seguro: 'AXA-160254527800', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-041', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Gris Mercurio', Numero_Serie: 'AFAFR6CB7RP128309', Placa: 'XH5164B', Poliza_Seguro: 'AXA-150260628701', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-042', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2023', Color: 'AZUL RISING', Numero_Serie: 'WVW3A4D21PT021008', Placa: 'YTC448B', Poliza_Seguro: '5091914', Email_encargado: null, Departamento: 'Ventas', Contrato: 'SOLUFI', Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-043', Marca: 'Volkswagen', Modelo: 'Virtus', Linea: '2023', Color: 'PLATA REFLEX', Numero_Serie: 'WVW3A4D22PT019672', Placa: 'YTC447B', Poliza_Seguro: null, Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-044', Marca: 'Ford', Modelo: 'F350', Linea: '2024', Color: 'Blanco oxford', Numero_Serie: '1FDRF3GN7RED45269', Placa: 'XP0337B', Poliza_Seguro: 'AXA -150270985901', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-045', Marca: 'Ford', Modelo: 'Ranger', Linea: '2023', Color: 'Negro obsidiana', Numero_Serie: 'AFAFR6CB1PP125466', Placa: 'XP0443B', Poliza_Seguro: 'AXA - 160204784600', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SFG-C259-LVT', Ubicacion: 'Veracruz', Percance: null },
      { Consecutivo: 'AVH-046', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB7RP136037', Placa: 'XS2637B', Poliza_Seguro: 'AXA-160204784600', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Comalcalco', Percance: null },
      { Consecutivo: 'AVH-047', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB3RP136049', Placa: 'XS2636B', Poliza_Seguro: 'AXA-160204786800', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-048', Marca: 'Ford', Modelo: 'Ranger', Linea: '2024', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB9RP136041', Placa: 'XS2638B', Poliza_Seguro: 'AXA-160204787100', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Mapachapa', Percance: null },
      { Consecutivo: 'AVH-049', Marca: 'Toyota', Modelo: 'Hilux', Linea: '2025', Color: 'Blanco', Numero_Serie: 'MR0CX3DD8S1357044', Placa: 'XS2534B', Poliza_Seguro: 'AXA-160220846200', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SFG-C259-LVT', Ubicacion: 'Veracruz', Percance: null },
      { Consecutivo: 'AVH-050', Marca: 'Ford', Modelo: 'Ranger', Linea: '2025', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB5SP136270', Placa: 'XT1304B', Poliza_Seguro: 'AXA-160222317200', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: 'SFG-C254-RIO', Ubicacion: 'Rio Bravo', Percance: null },
      { Consecutivo: 'AVH-051', Marca: 'Ford', Modelo: 'Ranger', Linea: '2025', Color: 'Blanco nieve', Numero_Serie: 'AFAFR6CB2SP136288', Placa: 'XT1305B', Poliza_Seguro: 'AXA-160222313700', Email_encargado: null, Departamento: 'SERVICIOS', Contrato: null, Ubicacion: 'Cd. Obregón', Percance: null },
      { Consecutivo: 'AVH-052', Marca: 'Ford', Modelo: 'Ranger', Linea: '2025', Color: 'Plata', Numero_Serie: 'AFAFR6CB2SP136825', Placa: 'XT1306B', Poliza_Seguro: 'AXA-160222315600', Email_encargado: null, Departamento: 'INGENIERÍA', Contrato: 'SFG-C197-MRC', Ubicacion: 'Cadereyta', Percance: null },

      // --- TABLA AVH-D ---
      { Consecutivo: 'AVH-D01', Marca: 'Mercedes-benz', Modelo: 'GLE 450', Linea: '2022', Color: 'Negro obsidiana', Numero_Serie: '4JGFD5KB8NA791319', Placa: 'YJH664B', Poliza_Seguro: 'AXA-140279610502', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: 'Es de Manuel Martinez pero lo pidieron por AVH' },
      { Consecutivo: 'AVH-D02', Marca: 'chrysler', Modelo: 'Jeep grand cherokee', Linea: '2022', Color: 'Negro diamante', Numero_Serie: '1C4RJHET0N8588299', Placa: 'YJH114B', Poliza_Seguro: 'AXA-150278701400', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D03', Marca: 'Infiniti', Modelo: 'Infiniti', Linea: '2022', Color: 'Graphite shadow', Numero_Serie: '5N1DL1MH4NC344351', Placa: 'YJH510B', Poliza_Seguro: 'AXA-150223299801', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D04', Marca: 'Tesla', Modelo: 'X SUV', Linea: '2022', Color: 'Negro', Numero_Serie: '7SAYGDEE3NF509103', Placa: 'YJH195B', Poliza_Seguro: 'AXA -140283656802', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D05', Marca: 'CHEVROLET', Modelo: 'TRACKER', Linea: '2023', Color: 'Blanco', Numero_Serie: '93CER76C4PB133340', Placa: 'YJH196B', Poliza_Seguro: 'AXA-150228498101', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D06', Marca: 'CHRYSLER', Modelo: 'JOURNEY SPORT', Linea: '2022', Color: 'NEGRO BRILLANTE', Numero_Serie: 'LMWDT1G8XN1115022', Placa: 'YJH559B', Poliza_Seguro: 'AXA-140286531703', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: 'Villahermosa', Percance: null },
      { Consecutivo: 'AVH-D07', Marca: 'Ford', Modelo: 'TERRITORY', Linea: '2023', Color: 'AZUL PROFUNDO', Numero_Serie: 'LJXBS5A31PYF04128', Placa: 'YKJ395B', Poliza_Seguro: 'AXA -160255143200', Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D08', Marca: 'Jac', Modelo: 'SEI2 SMART TM', Linea: '2023', Color: 'Blanco', Numero_Serie: 'LJ12EKR20P4008477', Placa: 'YKK003B', Poliza_Seguro: null, Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D09', Marca: 'VOLKSWAGEN', Modelo: 'Jetta', Linea: '2023', Color: 'BLANCO PURO', Numero_Serie: '3VWHP6BU6PM013812', Placa: 'YNV676B', Poliza_Seguro: null, Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
      { Consecutivo: 'AVH-D10', Marca: 'Honda', Modelo: 'Touring T AUT', Linea: '2023', Color: 'Plata Lunar', Numero_Serie: '5KBRL6885PB800883', Placa: 'YSW381B', Poliza_Seguro: null, Email_encargado: null, Departamento: null, Contrato: null, Ubicacion: null, Percance: null },
    ]
  })

  console.log('--- ✅ BASE DE DATOS RECONSTRUIDA Y LISTA ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })