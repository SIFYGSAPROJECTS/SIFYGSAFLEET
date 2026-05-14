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

interface TicketCreatedEmailProps {
  marca: string;
  modelo: string;
  placa: string;
  solicitanteEmail: string;
  tipoServicio: string;
  kilometraje?: number | null;
  nota?: string | null;
  taller?: string | null;
  descripcionFormatted: string;
}

export const TicketCreatedEmail = ({
  marca = 'Marca',
  modelo = 'Modelo',
  placa = 'XXX-000',
  solicitanteEmail = 'usuario@sifygsa.com',
  tipoServicio = 'Preventivo',
  kilometraje,
  nota,
  taller,
  descripcionFormatted = 'Descripción del trabajo',
}: TicketCreatedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nueva Orden de Servicio ({tipoServicio}): {placa}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>Orden Generada Exitosamente 🔧</Heading>
            <Text style={text}>
              Se ha registrado una nueva solicitud de servicio en el sistema. A continuación, los detalles de la unidad:
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}><strong>🚗 Unidad:</strong> {marca} {modelo} ({placa})</Text>
              <Text style={infoText}><strong>👤 Solicitante:</strong> {solicitanteEmail}</Text>
              <Text style={infoText}><strong>📋 Servicio:</strong> {tipoServicio}</Text>
              {kilometraje && (
                <Text style={infoText}><strong>⏱️ Odómetro Actual:</strong> {kilometraje.toLocaleString()} KM</Text>
              )}
              {nota && (
                <Text style={infoText}><strong>⚙️ Mantenimiento de:</strong> {nota}</Text>
              )}
              {taller && (
                <Text style={infoText}><strong>📍 Taller Sugerido:</strong> {taller}</Text>
              )}
            </Section>

            <Text style={labelBold}>Trabajo a realizar:</Text>
            <Section style={descriptionBox}>
              {/* Usamos dangerouslySetInnerHTML para renderizar los <br/> que se generaban en el string original */}
              <Text style={descriptionText} dangerouslySetInnerHTML={{ __html: `"${descripcionFormatted}"` }} />
            </Section>

            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com" style={button}>
                Dar Seguimiento a mi Orden
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Consulta el estatus de todos tus servicios accediendo a <strong>cloud.sifygsa.com</strong>
            </Text>
            <Text style={footerText}>
              Este es un mensaje automático de SIFYGSA Fleet. Por favor no respondas a este correo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketCreatedEmail;

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
};

const text = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
};

const infoBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #3b82f6',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#334155',
  fontSize: '14px',
};

const labelBold = {
  fontWeight: 'bold',
  color: '#1e293b',
  marginBottom: '8px',
  fontSize: '15px',
};

const descriptionBox = {
  backgroundColor: '#f1f5f9',
  padding: '15px',
  borderRadius: '6px',
  fontStyle: 'italic',
  border: '1px solid #e2e8f0',
};

const descriptionText = {
  margin: '0',
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.5',
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
