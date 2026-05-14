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

interface TicketCitaEmailProps {
  folio: string;
  lugar?: string;
  fecha?: string;
  hora?: string;
  asesor?: string;
  numeroAsesor?: string;
  linkTaller?: string;
  marca: string;
  modelo: string;
  placa: string;
}

export const TicketCitaEmail = ({
  folio,
  lugar = 'Por confirmar',
  fecha = 'Por confirmar',
  hora = 'Por confirmar',
  asesor,
  numeroAsesor,
  linkTaller,
  marca,
  modelo,
  placa,
}: TicketCitaEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>📅 Cita Confirmada: Mantenimiento SIFYGSA - Folio: {folio}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>¡Cita Programada! 📅</Heading>
            <Text style={text}>
              Tu unidad tiene una cita de servicio confirmada. Aquí están los detalles:
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoText}><strong>📍 Lugar:</strong> {lugar}</Text>
              <Text style={infoText}><strong>📅 Fecha:</strong> {fecha}</Text>
              <Text style={infoText}><strong>⏰ Hora:</strong> {hora}</Text>
              {asesor && <Text style={infoText}><strong>👤 Asesor:</strong> {asesor}</Text>}
              {numeroAsesor && <Text style={infoText}><strong>📞 Tel. Asesor:</strong> {numeroAsesor}</Text>}
            </Section>
            
            <Section style={vehicleBox}>
              <Text style={vehicleText}>
                🚗 Unidad: {marca} {modelo} ({placa})
              </Text>
            </Section>

            <Section style={buttonContainer}>
              {linkTaller && (
                <Link href={linkTaller} style={buttonSecondary}>
                  Ver en Mapa
                </Link>
              )}
              <Link href="https://cloud.sifygsa.com" style={buttonPrimary}>
                Consultar en Plataforma
              </Link>
            </Section>
          </Section>
          
          <Section style={footer}>
            <Text style={warningText}>⚠️ Por favor, llega 10 minutos antes de tu cita.</Text>
            <Text style={footerText}>
              Consulta detalles adicionales en <strong>cloud.sifygsa.com</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketCitaEmail;

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
  color: '#0f172a',
  marginTop: '0',
  fontSize: '20px',
  textAlign: 'center' as const,
};

const text = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
};

const infoBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #0ea5e9',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#334155',
  fontSize: '14px',
};

const vehicleBox = {
  backgroundColor: '#eff6ff',
  padding: '15px',
  borderRadius: '8px',
  margin: '20px 0',
  textAlign: 'center' as const,
  border: '1px solid #bfdbfe',
};

const vehicleText = {
  margin: '0',
  color: '#1d4ed8',
  fontWeight: 'bold',
  fontSize: '14px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0 15px 0',
};

const buttonSecondary = {
  backgroundColor: '#e2e8f0',
  color: '#475569',
  padding: '14px 24px',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  fontSize: '14px',
  marginRight: '10px',
};

const buttonPrimary = {
  backgroundColor: '#0f172a',
  color: '#ffffff',
  padding: '14px 24px',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  fontSize: '14px',
};

const footer = {
  backgroundColor: '#f1f5f9',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
};

const warningText = {
  margin: '0 0 5px 0',
  color: '#dc2626',
  fontWeight: 'bold',
  fontSize: '12px',
};

const footerText = {
  margin: '0',
  fontSize: '12px',
  color: '#64748b',
};
