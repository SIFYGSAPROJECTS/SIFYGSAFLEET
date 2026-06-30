import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  equipoData: {
    C_Interno: string;
    Marca: string;
    Modelo: string;
    Service_Tag: string;
  };
  fechaProgramada: string;
  tipoMtto: string;
  reporteId: number;
  appUrl: string;
}

export const MantenimientoAsignadoEmail = ({
  equipoData,
  fechaProgramada,
  tipoMtto,
  reporteId,
  appUrl,
}: Props) => {
  const confirmUrl = `${appUrl}/api/mantenimientos/confirmar?id=${reporteId}&accion=confirmar`;
  const rescheduleUrl = `${appUrl}/portal?action=reprogramar&id=${reporteId}`; // Could redirect to a specific portal view

  return (
    <Html>
      <Head />
      <Preview>Mantenimiento programado para tu equipo {equipoData.C_Interno}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Mantenimiento Programado</Heading>
          
          <Text style={text}>
            Hola, se ha programado un mantenimiento <strong>{tipoMtto.toLowerCase()}</strong> para el equipo que tienes asignado.
          </Text>

          <Section style={informationTable}>
            <Row style={informationTableRow}>
              <Column colSpan={2}>
                <Text style={informationTableLabel}>FECHA PROGRAMADA</Text>
                <Text style={informationTableValue}>{fechaProgramada}</Text>
              </Column>
            </Row>
            <Row style={informationTableRow}>
              <Column>
                <Text style={informationTableLabel}>EQUIPO</Text>
                <Text style={informationTableValue}>{equipoData.C_Interno}</Text>
              </Column>
              <Column>
                <Text style={informationTableLabel}>MODELO</Text>
                <Text style={informationTableValue}>{equipoData.Marca} {equipoData.Modelo}</Text>
              </Column>
            </Row>
          </Section>

          <Text style={text}>
            Por favor confirma si estarás disponible en esta fecha para realizar el mantenimiento a tu equipo.
          </Text>

          <Section style={buttonContainer}>
            <Button style={buttonConfirm} href={confirmUrl}>
              Sí, confirmo la fecha
            </Button>
            <br />
            <br />
            <Button style={buttonReschedule} href={rescheduleUrl}>
              No puedo, necesito reprogramar
            </Button>
          </Section>
          
          <Text style={footerText}>
            Si tienes dudas, contacta al departamento de Sistemas.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

MantenimientoAsignadoEmail.PreviewProps = {
  equipoData: {
    C_Interno: 'AVH-COM-001',
    Marca: 'Dell',
    Modelo: 'Latitude 5420',
    Service_Tag: 'ABC1234',
  },
  fechaProgramada: '15 de Octubre de 2026',
  tipoMtto: 'Preventivo',
  reporteId: 1,
  appUrl: 'http://localhost:3000',
} as Props;

export default MantenimientoAsignadoEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '40px',
  margin: '0 0 20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '0 40px',
};

const informationTable = {
  borderCollapse: 'collapse' as const,
  margin: '20px 40px',
  width: 'calc(100% - 80px)',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
};

const informationTableRow = {
  height: '46px',
};

const informationTableLabel = {
  color: '#8898aa',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  padding: '12px 16px 4px',
  margin: 0,
};

const informationTableValue = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
  padding: '0 16px 12px',
  margin: 0,
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const buttonConfirm = {
  backgroundColor: '#10b981',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '240px',
  padding: '14px 7px',
};

const buttonReschedule = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '5px',
  color: '#374151',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '240px',
  padding: '14px 7px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '40px',
  textAlign: 'center' as const,
};
