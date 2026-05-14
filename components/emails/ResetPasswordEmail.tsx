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

interface ResetPasswordEmailProps {
  empleadoNombre: string;
  pinTemporal: string;
}

export const ResetPasswordEmail = ({
  empleadoNombre = 'Usuario',
  pinTemporal = '000000',
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🔐 Clave Temporal de Acceso - SIFYGSA Fleet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>Recuperación de Acceso 🔐</Heading>
            <Text style={text}>
              Hola <strong>{empleadoNombre}</strong>, hemos recibido una solicitud para acceder a tu cuenta.
            </Text>
            
            <Section style={pinBox}>
              <Text style={pinLabel}>Tu clave temporal de un solo uso es:</Text>
              <Text style={pinValue}>{pinTemporal}</Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com" style={button}>
                Ir a Iniciar Sesión
              </Link>
            </Section>
          </Section>
          
          <Section style={footerAlert}>
            <Text style={alertTextBold}>⏱️ Esta clave expirará en 10 minutos.</Text>
            <Text style={alertText}>
              Usa este PIN en lugar de tu contraseña habitual para entrar al sistema.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              Si no solicitaste este código, puedes ignorar este correo de forma segura.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ResetPasswordEmail;

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

const pinBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #0f172a',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
  textAlign: 'center' as const,
};

const pinLabel = {
  margin: '0 0 10px 0',
  color: '#64748b',
  fontSize: '14px',
};

const pinValue = {
  margin: '0',
  fontFamily: 'monospace',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  color: '#0f172a',
  background: '#e2e8f0',
  padding: '10px',
  borderRadius: '8px',
  display: 'inline-block',
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

const footerAlert = {
  backgroundColor: '#fff1f2',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #fecdd3',
};

const alertTextBold = {
  margin: '0 0 5px 0',
  fontWeight: 'bold',
  fontSize: '13px',
  color: '#9f1239',
};

const alertText = {
  margin: '0',
  fontSize: '13px',
  color: '#9f1239',
};

const footer = {
  backgroundColor: '#f1f5f9',
  padding: '15px',
  textAlign: 'center' as const,
};

const footerText = {
  margin: '0',
  fontSize: '11px',
  color: '#94a3b8',
};
