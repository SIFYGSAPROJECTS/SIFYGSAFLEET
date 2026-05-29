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

interface DocumentoExpiradoEmailProps {
  consecutivo: string;
  tituloDocumento: string;
  fechaExpiracion: string;
  diasRestantes: number;
}

export const DocumentoExpiradoEmail = ({
  consecutivo = 'XXX-000',
  tituloDocumento = 'Póliza de Seguro',
  fechaExpiracion = '01/01/2026',
  diasRestantes = 15,
}: DocumentoExpiradoEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Aviso de Vencimiento: {tituloDocumento} de la unidad {consecutivo}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>

          <Section style={content}>
            <Heading style={title}>Documento Próximo a Vencer</Heading>
            <Text style={text}>
              El sistema ha detectado que uno de los documentos de la flota está a punto de caducar.
              Por favor, revisa la información a continuación y actualiza el expediente lo antes posible.
            </Text>

            <Section style={infoBox}>
              <Text style={infoText}><strong>🚗 Unidad:</strong> {consecutivo}</Text>
              <Text style={infoText}><strong>📄 Documento:</strong> {tituloDocumento}</Text>
              <Text style={infoText}><strong>📅 Fecha de Vencimiento:</strong> {fechaExpiracion}</Text>
              <Text style={infoText}><strong>⏳ Tiempo Restante:</strong> {diasRestantes <= 0 ? 'Vencido' : `${diasRestantes} días`}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com/dashboard/documentos" style={button}>
                Gestionar Documentos
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              Este es un mensaje automático de alertas de SIFYGSA Fleet. Por favor no respondas a este correo.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DocumentoExpiradoEmail;

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
  backgroundColor: '#b45309', // amber-700
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
  backgroundColor: '#fffbeb', // amber-50
  borderLeft: '4px solid #f59e0b', // amber-500
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#334155',
  fontSize: '14px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0 15px 0',
};

const button = {
  backgroundColor: '#d97706', // amber-600
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
