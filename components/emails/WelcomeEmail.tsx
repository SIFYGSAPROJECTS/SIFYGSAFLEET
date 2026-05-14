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

interface WelcomeEmailProps {
  nombre: string;
  apellidoPaterno: string;
  email: string;
  passwordTemporal: string;
  rol: string;
}

export const WelcomeEmail = ({
  nombre = 'Usuario',
  apellidoPaterno = '',
  email = 'usuario@sifygsa.com',
  passwordTemporal = '123456',
  rol = 'USER',
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🔐 Bienvenido a SIFYGSA Fleet - Tus Credenciales de Acceso</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA FLEET</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>¡Bienvenido al Equipo! 🚛</Heading>
            <Text style={text}>
              Hola <strong>{nombre} {apellidoPaterno}</strong>, se ha creado tu cuenta corporativa en el Sistema de Gestión de Flota SIFYGSA. A continuación, tus credenciales de acceso:
            </Text>
            
            <Section style={infoBox}>
              <Text style={infoText}><strong>✉️ Usuario:</strong> {email.toLowerCase()}</Text>
              <Text style={infoText}>
                <strong>🔑 Contraseña Temporal:</strong>{' '}
                <span style={passwordPill}>{passwordTemporal}</span>
              </Text>
              <Text style={infoText}><strong>🛡️ Nivel de Acceso:</strong> {rol}</Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com" style={button}>
                Iniciar Sesión Ahora
              </Link>
            </Section>
          </Section>
          
          <Section style={footerAlert}>
            <Text style={alertTextBold}>
              ⚠️ Por seguridad, cambia esta contraseña desde la sección "Mi Perfil" al entrar.
            </Text>
            <Text style={footerText}>
              Plataforma Oficial: <strong>cloud.sifygsa.com</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  color: '#059669',
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
  borderLeft: '4px solid #10b981',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#064e3b',
  fontSize: '14px',
};

const passwordPill = {
  fontFamily: 'monospace',
  fontSize: '16px',
  background: '#d1fae5',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold',
  letterSpacing: '1px',
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
  backgroundColor: '#f1f5f9',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e2e8f0',
};

const alertTextBold = {
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
