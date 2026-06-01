export type PeriodoVerificacion = {
  periodo: number; // 1 o 2
  fechaInicio: Date;
  fechaFin: Date;
};

/**
 * Calcula los plazos de verificación de acuerdo al último dígito de la placa.
 * Reglas (Color Engomado | Terminación | P1 | P2):
 * Amarillo | 5 ó 6 | Enero - Febrero | Julio - Agosto
 * Rosa     | 7 ó 8 | Febrero - Marzo | Agosto - Septiembre
 * Rojo     | 3 ó 4 | Marzo - Abril   | Septiembre - Octubre
 * Verde    | 1 ó 2 | Abril - Mayo    | Octubre - Noviembre
 * Azul     | 9 ó 0 | Mayo - Junio    | Noviembre - Diciembre
 * 
 * @param placa Cadena de la placa (ej. "ABC-123-A" o "12345")
 * @param anio Año para calcular las fechas (ej. 2024)
 * @returns Arreglo con los dos periodos esperados o null si la placa no es válida
 */
export function getVerificationPeriods(placa: string, anio: number): PeriodoVerificacion[] | null {
  if (!placa) return null;

  // Extraer el último dígito numérico de la placa
  const match = placa.match(/\d/g);
  if (!match || match.length === 0) return null;

  const lastDigit = parseInt(match[match.length - 1], 10);

  // Mapeo del último dígito a meses (0-indexado en JS: 0=Enero, 11=Diciembre)
  // mesesP1: [mesInicio, mesFin]
  let mesesP1: [number, number];
  let mesesP2: [number, number];

  if (lastDigit === 5 || lastDigit === 6) { // Amarillo
    mesesP1 = [0, 1];   // Enero - Febrero
    mesesP2 = [6, 7];   // Julio - Agosto
  } else if (lastDigit === 7 || lastDigit === 8) { // Rosa
    mesesP1 = [1, 2];   // Febrero - Marzo
    mesesP2 = [7, 8];   // Agosto - Septiembre
  } else if (lastDigit === 3 || lastDigit === 4) { // Rojo
    mesesP1 = [2, 3];   // Marzo - Abril
    mesesP2 = [8, 9];   // Septiembre - Octubre
  } else if (lastDigit === 1 || lastDigit === 2) { // Verde
    mesesP1 = [3, 4];   // Abril - Mayo
    mesesP2 = [9, 10];  // Octubre - Noviembre
  } else if (lastDigit === 9 || lastDigit === 0) { // Azul
    mesesP1 = [4, 5];   // Mayo - Junio
    mesesP2 = [10, 11]; // Noviembre - Diciembre
  } else {
    return null;
  }

  // Función auxiliar para obtener el último día del mes
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0);
  };

  return [
    {
      periodo: 1,
      fechaInicio: new Date(anio, mesesP1[0], 1),
      fechaFin: getLastDayOfMonth(anio, mesesP1[1]),
    },
    {
      periodo: 2,
      fechaInicio: new Date(anio, mesesP2[0], 1),
      fechaFin: getLastDayOfMonth(anio, mesesP2[1]),
    }
  ];
}
