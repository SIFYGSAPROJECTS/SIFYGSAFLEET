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
} from '@react-email/components';
import * as React from 'react';

interface TicketEnTallerEmailProps {
  empleadoNombre: string;
  folio: string;
  marca: string;
  modelo: string;
  placa: string;
}

export const TicketEnTallerEmail = ({
  empleadoNombre = 'Usuario',
  folio,
  marca,
  modelo,
  placa,
}: TicketEnTallerEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🛠️ Unidad en Mantenimiento - Folio: {folio}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>Vehículo en Taller 🛠️</Heading>
            <Text style={text}>
              Hola <strong>{empleadoNombre}</strong>, te confirmamos que tu unidad ha ingresado exitosamente al taller para su servicio.
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoText}><strong>🚗 Unidad:</strong> {marca} {modelo}</Text>
              <Text style={infoText}><strong>🔢 Placas:</strong> {placa}</Text>
              <Text style={infoText}><strong>📋 Folio:</strong> {folio}</Text>
            </Section>
            
            <Text style={subText}>
              Te notificaremos por este medio en cuanto el vehículo esté listo para su recolección.
            </Text>

            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com/dashboard/servicios" style={button}>
                Seguir el Avance en SIFYGSA
              </Link>
            </Section>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              Accede a <strong>cloud.sifygsa.com</strong> para revisar tu historial.
            </Text>
            <Text style={footerText}>
              Este es un mensaje automático de SIFYGSA Fleet.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketEnTallerEmail;

// Estilos
const main = {
  backgroundColor: '#f8fafc',
  padding: '20px 0',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const header = {
  backgroundColor: '#1e293b',
  padding: '25px 20px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '1px',
};

const content = {
  padding: '30px',
};

const title = {
  color: '#d97706',
  marginTop: '0',
  fontSize: '20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
};

const infoBox = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#78350f',
  fontSize: '14px',
};

const subText = {
  color: '#475569',
  fontSize: '14px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0 15px 0',
};

const button = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  padding: '14px 32px',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  fontSize: '15px',
};

const footer = {
  backgroundColor: '#f1f5f9',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
};

const footerText = {
  margin: '0 0 5px 0',
  fontSize: '12px',
  color: '#64748b',
};
