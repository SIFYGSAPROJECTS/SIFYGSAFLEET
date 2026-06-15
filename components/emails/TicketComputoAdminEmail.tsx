import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Img,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface TicketComputoAdminEmailProps {
  solicitante: string;
  departamento: string;
  serviceTag: string;
  telefono: string;
  tipoSolicitud: string;
  motivo: string;
  folio: string;
}

export const TicketComputoAdminEmail = ({
  solicitante = 'N/A',
  departamento = 'N/A',
  serviceTag = 'N/A',
  telefono = 'N/A',
  tipoSolicitud = 'N/A',
  motivo = 'N/A',
  folio = 'N/A',
}: TicketComputoAdminEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Nueva solicitud de Cómputo de {solicitante}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Image */}
          <Section style={imageSection}>
            <Img
              src="https://cloud.sifygsa.com/header-computo.png"
              width="600"
              height="auto"
              alt="SIFYGSA Mantenimiento TI"
              style={headerImage}
            />
          </Section>

          <Section style={content}>
            <Text style={text}>Estimado(a),</Text>
            
            <Text style={text}>
              Se le comunica que se realizo una solicitud de mantentenimiento y/o revisión de equipo de computo, por parte de <strong>{solicitante}</strong> con las siguientes especificaciones:
            </Text>

            <Section style={listContainer}>
              <ul style={list}>
                <li style={listItem}><strong>Responsable del equipo:</strong> {solicitante}</li>
                <li style={listItem}><strong>Departamento:</strong> {departamento}</li>
                <li style={listItem}><strong>Número Tag del equipo:</strong> {serviceTag}</li>
                <li style={listItem}><strong>Número de telefónico:</strong> {telefono}</li>
                <li style={listItem}><strong>Tipo de solicitud:</strong> {tipoSolicitud}</li>
                <li style={listItem}><strong>Motivo:</strong> {motivo}</li>
                <li style={listItem}>
                  <strong>Ingrese a los detalles:</strong>{' '}
                  <Link href="https://cloud.sifygsa.com/computo/servicios" style={link}>
                    Ver Seguimiento de Tickets SIFYGSA (Folio {folio})
                  </Link>
                </li>
              </ul>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketComputoAdminEmail;

// Estilos
const main = {
  backgroundColor: '#ffffff',
  padding: '20px 0',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
};

const content = {
  padding: '20px',
};

const text = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.6',
  marginBottom: '15px',
};

const listContainer = {
  marginBottom: '20px',
};

const list = {
  paddingLeft: '20px',
  margin: '0',
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.6',
};

const listItem = {
  marginBottom: '5px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const imageSection = {
  width: '100%',
  backgroundColor: '#fba73c',
};

const headerImage = {
  width: '100%',
  maxWidth: '600px',
  display: 'block',
  margin: '0 auto',
};
