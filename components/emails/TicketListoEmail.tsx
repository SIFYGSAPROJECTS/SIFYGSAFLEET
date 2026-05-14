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

interface TicketListoEmailProps {
  empleadoNombre: string;
  folio: string;
  marca: string;
  modelo: string;
  placa: string;
  asesor?: string;
  numeroAsesor?: string;
  linkTaller?: string;
}

export const TicketListoEmail = ({
  empleadoNombre = 'Usuario',
  folio,
  marca,
  modelo,
  placa,
  asesor,
  numeroAsesor,
  linkTaller,
}: TicketListoEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>✅ Tu unidad está lista para recolección - Folio: {folio}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>¡Tu vehículo está listo! 🚗✨</Heading>
            <Text style={text}>
              Hola <strong>{empleadoNombre}</strong>, te informamos que el servicio de mantenimiento de tu unidad ha concluido exitosamente. Ya puedes pasar a recogerla.
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoText}><strong>🚗 Vehículo:</strong> {marca} {modelo}</Text>
              <Text style={infoText}><strong>🔢 Placas:</strong> {placa}</Text>
              <Text style={infoText}><strong>📋 Folio:</strong> {folio}</Text>
              {asesor && <Text style={infoText}><strong>👤 Asesor a cargo:</strong> {asesor}</Text>}
              {numeroAsesor && <Text style={infoText}><strong>📞 Teléfono Asesor:</strong> {numeroAsesor}</Text>}
            </Section>

            <Section style={buttonContainer}>
              {linkTaller && (
                <Link href={linkTaller} style={buttonSecondary}>
                  Ver Mapa del Taller
                </Link>
              )}
              <Link href="https://cloud.sifygsa.com/dashboard/servicios" style={buttonPrimary}>
                Confirmar en Plataforma
              </Link>
            </Section>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              Asegúrate de revisar la unidad antes de retirarla del taller.
            </Text>
            <Text style={footerText}>
              Para más información, entra a <strong>cloud.sifygsa.com</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketListoEmail;

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
  color: '#16a34a',
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
  backgroundColor: '#f0fdf4',
  borderLeft: '4px solid #22c55e',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#14532d',
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

const footerText = {
  margin: '0 0 5px 0',
  fontSize: '12px',
  color: '#64748b',
};
