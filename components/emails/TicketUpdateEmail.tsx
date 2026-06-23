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

interface TicketUpdateEmailProps {
  folio: string;
  tipo: 'NUEVO_ASESOR' | 'NUEVO_ESTATUS';
  esParaAsesor: boolean;
  destinatarioNombre: string;
  ticketDescripcion: string;
  nuevoValor: string; // Puede ser el nombre del asesor o el estatus
}

export const TicketUpdateEmail = ({
  folio = 'TIC-000',
  tipo = 'NUEVO_ESTATUS',
  esParaAsesor = false,
  destinatarioNombre = 'Usuario',
  ticketDescripcion = 'Sin descripción',
  nuevoValor = 'PENDIENTE',
}: TicketUpdateEmailProps) => {
  const previewText = tipo === 'NUEVO_ASESOR' 
    ? `Asignación de Ticket: ${folio}` 
    : `Actualización de Estatus: ${folio}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>SIFYGSA TI</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={title}>
              {tipo === 'NUEVO_ASESOR' ? '🔧 Ticket Asignado' : '📝 Actualización de Ticket'}
            </Heading>
            <Text style={text}>
              Hola <strong>{destinatarioNombre}</strong>,
            </Text>
            
            {tipo === 'NUEVO_ASESOR' && esParaAsesor && (
              <Text style={text}>
                Se te ha asignado un nuevo ticket de soporte técnico. Por favor, revisa los detalles y ponte en contacto con el solicitante a la brevedad.
              </Text>
            )}

            {tipo === 'NUEVO_ASESOR' && !esParaAsesor && (
              <Text style={text}>
                Tu ticket de soporte técnico ha sido asignado a un asesor de TI. Se pondrán en contacto contigo pronto.
              </Text>
            )}

            {tipo === 'NUEVO_ESTATUS' && (
              <Text style={text}>
                Ha habido un cambio en el estatus de tu ticket de soporte técnico.
              </Text>
            )}
            
            <Section style={infoBox}>
              <Text style={infoText}><strong>🎫 Folio:</strong> {folio}</Text>
              
              {tipo === 'NUEVO_ASESOR' ? (
                <Text style={infoText}><strong>👨‍💻 Asesor Asignado:</strong> {nuevoValor}</Text>
              ) : (
                <Text style={infoText}><strong>📌 Nuevo Estatus:</strong> <span style={statusPill(nuevoValor)}>{nuevoValor}</span></Text>
              )}

              <Text style={infoText}><strong>📋 Detalles:</strong> {ticketDescripcion}</Text>
            </Section>
            
            <Section style={buttonContainer}>
              <Link href="https://cloud.sifygsa.com/computo" style={button}>
                Ver Ticket en Plataforma
              </Link>
            </Section>
          </Section>
          
          <Section style={footerAlert}>
            <Text style={footerText}>
              Este es un correo automático, por favor no respondas a este mensaje.
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

export default TicketUpdateEmail;

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
  backgroundColor: '#047857',
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
  color: '#047857',
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
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #047857',
  padding: '20px',
  borderRadius: '6px',
  margin: '25px 0',
};

const infoText = {
  margin: '8px 0',
  color: '#334155',
  fontSize: '14px',
};

const statusPill = (status: string) => ({
  fontFamily: 'monospace',
  fontSize: '14px',
  background: status === 'TERMINADO' ? '#d1fae5' : status === 'EN PROCESO' ? '#dbeafe' : '#fef3c7',
  color: status === 'TERMINADO' ? '#065f46' : status === 'EN PROCESO' ? '#1e40af' : '#92400e',
  padding: '2px 8px',
  borderRadius: '4px',
  fontWeight: 'bold',
  letterSpacing: '1px',
});

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '35px 0 15px 0',
};

const button = {
  backgroundColor: '#047857',
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

const footerText = {
  margin: '5px 0',
  fontSize: '12px',
  color: '#64748b',
};
