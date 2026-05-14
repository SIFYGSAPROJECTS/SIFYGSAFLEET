import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface SecurityAlertEmailProps {
  nombreUsuario: string;
  nuevaPassword?: string;
}

export const SecurityAlertEmail = ({
  nombreUsuario = 'Usuario',
  nuevaPassword,
}: SecurityAlertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>🔑 Tu contraseña ha sido restablecida - SIFYGSA Fleet</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>
              SIFYGSA <span style={headerHighlight}>Fleet</span>
            </Heading>
          </Section>
          
          <Section style={content}>
            <Text style={greeting}>Hola, {nombreUsuario}</Text>
            <Text style={message}>
              Tu contraseña de acceso al sistema SIFYGSA Fleet ha sido restablecida. A continuación, encontrarás tus nuevas credenciales.
            </Text>
            
            {nuevaPassword && (
              <Section style={passwordBox}>
                <Text style={passwordLabel}>NUEVA CONTRASEÑA</Text>
                <Text style={passwordValue}>{nuevaPassword}</Text>
              </Section>
            )}
            
            <Text style={messageCenter}>
              Por favor, ingresa al sistema utilizando esta contraseña. Te recomendamos mantenerla en un lugar seguro.
            </Text>
            
            <Text style={warning}>
              ⚠️ Si no solicitaste este cambio, contacta a soporte inmediatamente.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} SIFYGSA Fleet Management. Todos los derechos reservados.<br/>
              Este es un correo automático, por favor no respondas a esta dirección.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SecurityAlertEmail;

// Estilos
const main = {
  backgroundColor: '#0f172a',
  padding: '40px 0',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  color: '#f8fafc',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#1e293b',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #334155',
};

const header = {
  backgroundColor: '#0f172a',
  padding: '30px',
  textAlign: 'center' as const,
  borderBottom: '3px solid #01c38e',
};

const headerTitle = {
  color: '#f8fafc',
  margin: '0',
  fontSize: '24px',
  letterSpacing: '1px',
};

const headerHighlight = {
  color: '#01c38e',
};

const content = {
  padding: '40px 30px',
};

const greeting = {
  fontSize: '20px',
  fontWeight: 'bold',
  marginBottom: '20px',
  color: '#f8fafc',
};

const message = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#cbd5e1',
  marginBottom: '30px',
};

const passwordBox = {
  backgroundColor: '#0f172a',
  border: '1px solid #01c38e',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  marginBottom: '30px',
};

const passwordLabel = {
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  color: '#94a3b8',
  letterSpacing: '1px',
  marginBottom: '10px',
  display: 'block',
};

const passwordValue = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#10b981',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  margin: '0',
};

const messageCenter = {
  fontSize: '14px',
  textAlign: 'center' as const,
  color: '#cbd5e1',
};

const warning = {
  color: '#ef4444',
  fontSize: '14px',
  marginTop: '20px',
  textAlign: 'center' as const,
  fontWeight: 'bold',
};

const footer = {
  backgroundColor: '#0f172a',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #334155',
};

const footerText = {
  fontSize: '12px',
  color: '#64748b',
  margin: '0',
};
