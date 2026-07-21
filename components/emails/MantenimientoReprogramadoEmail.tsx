import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface Props {
  equipoData: {
    C_Interno: string;
    Usuario: string;
  };
  fechaOriginal: string;
  motivo: string;
  reporteId: number;
  appUrl: string;
}

export const MantenimientoReprogramadoEmail = ({
  equipoData,
  fechaOriginal,
  motivo,
  reporteId,
  appUrl,
}: Props) => {
  return (
    <Html>
      <Head />
      <Preview>Solicitud de reprogramación: {equipoData.C_Interno}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ Solicitud de Reprogramación</Heading>
          
          <Text style={text}>
            El usuario <strong>{equipoData.Usuario}</strong> ha solicitado reprogramar el mantenimiento del equipo <strong>{equipoData.C_Interno}</strong>.
          </Text>

          <Section style={detailsContainer}>
            <Text style={detailsText}>
              <strong>Fecha original:</strong> {fechaOriginal}
            </Text>
            <Text style={detailsText}>
              <strong>Motivo proporcionado:</strong>
            </Text>
            <Text style={motivoBox}>
              "{motivo}"
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${appUrl}/computo/soporte-mantenimientos?reporteId=${reporteId}`}>
              Ir a Mantenimientos
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

MantenimientoReprogramadoEmail.PreviewProps = {
  equipoData: {
    C_Interno: 'AVH-COM-001',
    Usuario: 'Aurelio Palacios',
  },
  fechaOriginal: '15 de Octubre de 2026',
  motivo: 'Estaré de vacaciones esa semana, favor de pasarlo para el día lunes 19.',
  reporteId: 1,
  appUrl: 'http://localhost:3000',
} as Props;

export default MantenimientoReprogramadoEmail;

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

const detailsContainer = {
  padding: '0 40px',
  marginTop: '20px',
};

const detailsText = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 10px',
};

const motivoBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '12px 16px',
  color: '#92400e',
  fontSize: '14px',
  fontStyle: 'italic',
  margin: '10px 0',
  whiteSpace: 'pre-wrap' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
};

const button = {
  backgroundColor: '#0ea5e9',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
};
